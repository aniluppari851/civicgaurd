import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: followers, error } = await supabaseAdmin
      .from('follows')
      .select('follower:follower_id(id, name, image_url, bio)')
      .eq('following_id', params.id);

    if (error) throw error;

    // Flatten the result
    const userList = followers.map(f => f.follower);

    return NextResponse.json(userList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
