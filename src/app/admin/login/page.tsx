'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('admin-login', {
      redirect: false,
      secretKey,
    });

    setLoading(false);

    if (res?.error) {
      setError('Invalid Secret Key. Access Denied.');
    } else {
      router.push('/admin/dashboard');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      padding: '1rem'
    }}>
      <div className="glass" style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '3rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem',
        borderTop: '4px solid var(--danger)'
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'rgba(239, 68, 68, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--danger)'
          }}>
            <Shield size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Restricted access. Enter your secret key to proceed.
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--danger)', 
            borderRadius: '0.5rem', 
            fontSize: '0.9rem',
            textAlign: 'center',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <KeyRound size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Enter Secret Key"
              required
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '1rem 1rem 1rem 3rem', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--border)', 
                borderRadius: '0.5rem',
                color: 'var(--text)',
                fontSize: '1rem',
                letterSpacing: '0.1em'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn"
            style={{ 
              width: '100%', 
              padding: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              background: 'var(--danger)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            {loading ? 'Authenticating...' : 'Secure Login'} 
            <ArrowRight size={20} />
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <a href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            &larr; Return to Public Site
          </a>
        </div>
      </div>
    </div>
  );
}
