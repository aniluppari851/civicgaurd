'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Shield, Building2 } from 'lucide-react';
import Link from 'next/link';
import { signIn, getSession, signOut } from 'next-auth/react';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.ok) {
      // Fetch session safely using NextAuth
      const session = await getSession();
      
      if (session?.user?.role === 'ADMIN') {
        alert('This login is for Citizens. Please use the Admin Portal.');
        await signOut({ redirect: false });
        window.location.href = '/admin/login';
      } else if (session?.user?.role === 'DEPARTMENT_OFFICER') {
        alert('This login is for Citizens. Please use the Officer Portal.');
        await signOut({ redirect: false });
        window.location.href = '/department/login';
      } else {
        window.location.href = '/dashboard';
      }
    } else {
      alert(result?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="container auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', overflow: 'hidden' }}>
      <style jsx>{`
        @media (max-width: 768px) {
          .auth-container { height: 100vh !important; padding: 0.5rem !important; overflow: hidden !important; }
          .auth-card { padding: 1.5rem !important; }
          .auth-title { font-size: 1.5rem !important; margin-bottom: 0 !important; }
          .auth-subtitle { margin-bottom: 1rem !important; }
          .auth-form { gap: 0.75rem !important; }
          .auth-input { padding: 0.5rem 1rem 0.5rem 2.5rem !important; }
          .auth-btn { padding: 0.75rem !important; margin-top: 0.5rem !important; }
          .auth-links { margin-top: 1rem !important; }
          .auth-portal-grid { padding: 0.5rem !important; gap: 0.5rem !important; font-size: 0.75rem !important; }
        }
      `}</style>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass auth-card" 
        style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}
      >
        <div className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="auth-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Login to track your reports</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="auth-input"
                type="email" 
                placeholder="john@example.com"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 3rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)'
                }}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="auth-input"
                type="password" 
                placeholder="••••••••"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 3rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)'
                }}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-btn" style={{ padding: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
            Sign In <LogIn size={20} />
          </button>
        </form>

        <div className="auth-links" style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Don't have an account? <Link href="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Register here</Link>
          </p>
          
          <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }}></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Link href="/admin/login" className="auth-portal-grid" style={{ 
              color: 'var(--danger)', 
              fontSize: '0.85rem', 
              textDecoration: 'none', 
              fontWeight: 600, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(239, 68, 68, 0.1)'
            }}>
              <Shield size={20} />
              Admin Login
            </Link>

            <Link href="/department/login" className="auth-portal-grid" style={{ 
              color: 'var(--primary)', 
              fontSize: '0.85rem', 
              textDecoration: 'none', 
              fontWeight: 600, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '1rem',
              background: 'rgba(99, 102, 241, 0.05)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(99, 102, 241, 0.1)',
              cursor: 'pointer'
            }}>
              <Building2 size={20} />
              Officer Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
