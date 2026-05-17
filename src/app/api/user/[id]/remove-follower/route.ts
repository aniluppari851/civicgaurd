import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const followerIdToRemove = params.id;

    // Delete the row where the follower_id is the target user, and following_id is the current user
    const { error } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', followerIdToRemove)
      .eq('following_id', currentUserId);

    if (error) throw error;

    return NextResponse.json({ message: 'Follower removed successfully' });
  } catch (error: any) {
    console.error('Remove follower error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
