import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Get the latest OTP for this email
    const { data: latestOtp, error } = await supabaseAdmin
      .from('verification_otps')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !latestOtp) {
      return NextResponse.json({ error: 'No OTP found for this email' }, { status: 404 });
    }

    // Check if OTP matches
    if (latestOtp.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Check if OTP is expired
    if (new Date(latestOtp.expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Success! Delete the OTP record (or mark as used)
    await supabaseAdmin
      .from('verification_otps')
      .delete()
      .eq('id', latestOtp.id);

    return NextResponse.json({ message: 'OTP verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
