import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id;

    // Fetch the current complaint
    const { data: complaint, error: fetchError } = await supabaseAdmin
      .from('complaints')
      .select('support_count, supported_by')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    let supportedBy = complaint.supported_by || [];
    let supportCount = complaint.support_count || 0;

    // Toggle logic
    if (supportedBy.includes(userId)) {
      // Dislike
      supportedBy = supportedBy.filter((uid: string) => uid !== userId);
      supportCount = Math.max(0, supportCount - 1);
    } else {
      // Like
      supportedBy = [...supportedBy, userId];
      supportCount += 1;
    }

    // Update the record
    const { data: updatedComplaint, error: updateError } = await supabaseAdmin
      .from('complaints')
      .update({ 
        support_count: supportCount,
        supported_by: supportedBy 
      })
      .eq('id', id)
      .select('support_count, supported_by')
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      support_count: updatedComplaint.support_count,
      supported_by: updatedComplaint.supported_by 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Support error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update support' }, { status: 500 });
  }
}
