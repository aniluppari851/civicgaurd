import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store in Supabase
    const { error: dbError } = await supabaseAdmin
      .from('verification_otps')
      .insert({
        email,
        otp,
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('Database Error (OTP Insert):', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Send via Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is missing. OTP will not be sent.');
      // For development, we return the OTP in the response if the key is missing
      return NextResponse.json({ 
        message: 'OTP generated (Dev Mode: API Key missing)', 
        otp: otp 
      }, { status: 200 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'CivicGuard <onboarding@resend.dev>',
        to: [email],
        subject: 'Verify your CivicGuard Account',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1; text-align: center;">CivicGuard Verification</h2>
            <p>Welcome to the community! Use the following code to verify your account:</p>
            <div style="background: #f4f4f5; padding: 20px; text-align: center; font-size: 2rem; font-weight: 800; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 0.8rem; text-align: center;">This code will expire in 10 minutes.</p>
          </div>
        `
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Resend API error:', errorData);
      throw new Error(`Resend Error: ${errorData.message || 'Unknown Resend error'}`);
    }

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('OTP Send Error Detailed:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate or send OTP' }, { status: 500 });
  }
}
