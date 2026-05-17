import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json([]);
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, image_url, role')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) throw error;

    return NextResponse.json(users);
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
