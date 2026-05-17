import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { name, email, password, image_url, officer_code } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine Role
    let role = 'USER';
    const secretCode = process.env.OFFICER_SECRET_CODE;
    if (officer_code && officer_code === secretCode) {
      role = 'DEPARTMENT_OFFICER';
    }

    // Check if user already exists in public.users
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // 1. Create user in Supabase Auth (using standard anon client to trigger email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?confirmed=true`,
        data: {
          name,
        }
      }
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user || !authData.user.id) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // 2. Upsert new user into public.users (upsert prevents crashes if a DB trigger already inserted it)
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        name,
        email,
        password: 'SUPABASE_AUTH_MANAGED', // Dummy value for old constraints
        role: role,
        image_url: image_url || null,
        bio: '', // Default empty bio
        is_blocked: false, // Default not blocked
        is_public: true // Default public profile
      }, { onConflict: 'id' })
      .select('id, name, email, role, image_url')
      .single();

    if (error) {
      console.error('Database Upsert Error:', error);
      throw error;
    }

    // If it's an officer, auto-assign to all departments for instant access
    if (role === 'DEPARTMENT_OFFICER') {
      const { data: allDepts } = await supabaseAdmin.from('departments').select('id');
      if (allDepts && allDepts.length > 0) {
        const userDepts = allDepts.map(d => ({ user_id: newUser.id, department_id: d.id }));
        await supabaseAdmin.from('user_departments').insert(userDepts);
      }
    }

    return NextResponse.json({ message: `User created as ${role}`, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
