import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'USER') return NextResponse.json({ error: 'Forbidden: Messaging is for Citizens only' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('otherUserId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'Other user ID is required' }, { status: 400 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${session.user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'USER') return NextResponse.json({ error: 'Forbidden: Messaging is for Citizens only' }, { status: 403 });

    const { receiver_id, content, type, file_url } = await req.json();

    if (!receiver_id) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
    }

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: session.user.id,
        receiver_id,
        content,
        type: type || 'TEXT',
        file_url
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
