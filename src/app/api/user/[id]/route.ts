import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const session = await getServerSession(authOptions);

    // Fetch user basic info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, bio, image_url, role, created_at, is_public')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's public complaints
    const { data: complaints, error: complaintsError } = await supabaseAdmin
      .from('complaints')
      .select('*, departments:assigned_department_id(name)')
      .eq('citizen_id', userId)
      .order('created_at', { ascending: false });

    // Fetch follow stats
    const { count: followersCount } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: followingCount } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Check if current user is following
    let isFollowing = false;
    if (session?.user?.id) {
      const { data: follow } = await supabaseAdmin
        .from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
        .maybeSingle();
      
      isFollowing = !!follow;
    }

    return NextResponse.json({
      user,
      complaints: complaints || [],
      stats: {
        followers: followersCount || 0,
        following: followingCount || 0,
        reports: complaints?.length || 0,
        resolved: complaints?.filter(c => c.status === 'RESOLVED').length || 0
      },
      isFollowing
    });
  } catch (error: any) {
    console.error('Fetch user profile error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
