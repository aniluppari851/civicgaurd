import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followerId = session.user.id;
    const followingId = params.id;

    if (followerId === followingId) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const { data: existingFollow } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (existingFollow) {
      // Unfollow
      const { error } = await supabaseAdmin
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
      return NextResponse.json({ message: 'Unfollowed', isFollowing: false });
    } else {
      // Follow
      const { error } = await supabaseAdmin
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        });

      if (error) throw error;

      // Notify the user being followed
      const followerName = session.user.name || 'A citizen';
      await supabaseAdmin.from('notifications').insert({
        user_id: followingId,
        title: 'New Follower',
        message: `${followerName} started following your civic sense`,
        metadata: { follower_id: followerId }
      });

      return NextResponse.json({ message: 'Followed', isFollowing: true });
    }
  } catch (error: any) {
    console.error('Follow toggle error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
