import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Check existing user error:', checkError);
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role: role,
        image_url: image_url || null,
        bio: '', // Default empty bio
        is_blocked: false, // Default not blocked
        is_public: true // Default public profile
      })
      .select('id, name, email, role, image_url')
      .single();

    if (error) throw error;

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
