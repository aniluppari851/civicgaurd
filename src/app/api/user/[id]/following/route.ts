import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: following, error } = await supabaseAdmin
      .from('follows')
      .select('following:following_id(id, name, image_url, bio)')
      .eq('follower_id', params.id);

    if (error) throw error;

    // Flatten the result
    const userList = following.map(f => f.following);

    return NextResponse.json(userList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
