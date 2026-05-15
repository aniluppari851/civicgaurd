import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'DEPARTMENT_OFFICER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: departments, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json(departments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
