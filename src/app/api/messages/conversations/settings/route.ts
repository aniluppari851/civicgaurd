import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { other_user_id, action, value } = await req.json();
    
    if (!other_user_id || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if a record already exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('user_chat_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('other_user_id', other_user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw fetchError;
    }

    let payload: any = {};
    if (action === 'PIN') payload.is_pinned = value;
    if (action === 'MUTE') payload.is_muted = value;
    if (action === 'HIDE') payload.is_hidden = value; // Delete action

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from('user_chat_settings')
        .update(payload)
        .eq('id', existing.id);
      
      if (updateError) throw updateError;
    } else {
      payload.user_id = userId;
      payload.other_user_id = other_user_id;
      
      const { error: insertError } = await supabaseAdmin
        .from('user_chat_settings')
        .insert(payload);
        
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Chat settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
