import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'USER') return NextResponse.json({ error: 'Forbidden: Messaging is for Citizens only' }, { status: 403 });

    const userId = session.user.id;

    // Fetch all messages involving the user
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*, sender:sender_id(id, name, image_url), receiver:receiver_id(id, name, image_url)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch user chat settings
    const { data: settings } = await supabaseAdmin
      .from('user_chat_settings')
      .select('*')
      .eq('user_id', userId);

    const settingsMap = new Map();
    settings?.forEach(s => settingsMap.set(s.other_user_id, s));

    // Group by conversation partner
    const conversationsMap = new Map();

    messages?.forEach(msg => {
      const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
      if (!otherUser) return;
      
      const userSettings = settingsMap.get(otherUser.id);
      
      // Skip hidden conversations
      if (userSettings?.is_hidden) return;

      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg,
          settings: {
            is_pinned: userSettings?.is_pinned || false,
            is_muted: userSettings?.is_muted || false
          }
        });
      }
    });

    // Sort: Pinned first, then by latest message
    const conversations = Array.from(conversationsMap.values()).sort((a, b) => {
      if (a.settings.is_pinned && !b.settings.is_pinned) return -1;
      if (!a.settings.is_pinned && b.settings.is_pinned) return 1;
      return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
