import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    let { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        users:citizen_id(name, email),
        officer:last_updated_by_officer_id(name, image_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API ERROR] Enhanced fetch failed, trying fallback:', error.message);
      // Fallback: Try without the officer join in case the column is missing
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('complaints')
        .select(`
          *,
          users:citizen_id(name, email)
        `)
        .eq('id', id)
        .single();
      
      if (fallbackError) {
        console.error('[API ERROR] Fallback fetch failed:', fallbackError.message);
        return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
      }
      complaint = fallbackData;
    }

    console.log(`[API DEBUG] Fetching complaint ${id}. Status in DB: ${complaint.status}`);

    return NextResponse.json(complaint, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Fetch complaint error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { data: session } = await getServerSession(authOptions) as any || { data: null };
    
    // Fallback if session is not available via getServerSession
    const authReq = await getServerSession(authOptions);
    
    if (!authReq) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, verify the complaint belongs to the user
    const { data: complaint, error: fetchError } = await supabaseAdmin
      .from('complaints')
      .select('citizen_id')
      .eq('id', id)
      .single();

    if (fetchError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    if (complaint.citizen_id !== authReq.user.id) {
      return NextResponse.json({ error: 'You do not have permission to delete this complaint' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('complaints')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: 'Complaint deleted successfully' });
  } catch (error: any) {
    console.error('Delete complaint error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
