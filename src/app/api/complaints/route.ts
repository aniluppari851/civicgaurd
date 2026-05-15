import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { triageComplaint } from '@/lib/triage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();    // AI Triage
    const { category: detectedCategory, priority: detectedPriority } = triageComplaint(data.description);
    
    // User selected category takes precedence, but we use detected for triage if "Others"
    const finalCategory = data.category && data.category !== 'Others' ? data.category : detectedCategory;
    const finalPriority = detectedPriority; // Always auto-detect priority for safety

    // Calculate SLA Deadline
    const deadline = new Date();
    if (finalPriority === 'URGENT') deadline.setHours(deadline.getHours() + 24);
    else if (finalPriority === 'HIGH') deadline.setDate(deadline.getDate() + 3);
    else if (finalPriority === 'MEDIUM') deadline.setDate(deadline.getDate() + 7);
    else deadline.setDate(deadline.getDate() + 14);

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .insert({
        title: data.title,
        description: data.description,
        category: finalCategory,
        priority: finalPriority,
        citizen_id: session.user.id,
        status: 'PENDING',
        lat: data.lat,
        lng: data.lng,
        address: data.address,
        image_url: data.image_url,
        deadline: deadline.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    // --- NOTIFY ADMINS ---
    try {
      // Direct, simple insert for the System Admin ID we just verified
      const systemAdminId = '00000000-0000-0000-0000-000000000000';
      
      const { error: notifyErr } = await supabaseAdmin.from('notifications').insert({
        user_id: systemAdminId,
        title: '🔔 New Complaint',
        message: `[${finalCategory}] ${data.title || 'New Issue Reported'}`
      });

      if (notifyErr) {
        console.error('[DATABASE ERROR] Admin notification failed:', notifyErr.message);
      } else {
        console.log('[NOTIFY] Successfully alerted System Admin bell.');
      }
    } catch (notifyError) {
      console.error('[SERVER ERROR] Notification logic failed:', notifyError);
    }

    return NextResponse.json(complaint, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/complaints error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit complaint' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select('*, departments:assigned_department_id(name), users:citizen_id(name, image_url)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(complaints);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
