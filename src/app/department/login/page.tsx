'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Building2, ChevronRight } from 'lucide-react';
import { signIn, getSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function DepartmentLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.ok) {
      const session = await getSession();
      
      if (session?.user?.role === 'DEPARTMENT_OFFICER') {
        window.location.href = '/department/dashboard';
      } else {
        // Automatically sign out if they used a citizen account
        await signOut({ redirect: false });
        setError('Access Denied: This portal is for Department Officers only.');
      }
    } else {
      setError('Invalid official credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{ padding: '3rem', width: '100%', maxWidth: '450px', borderTop: '4px solid var(--primary)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '60px', height: '60px', background: 'rgba(99, 102, 241, 0.1)', 
            borderRadius: '15px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary)' 
          }}>
            <Building2 size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Officer Portal</h2>
          <p style={{ color: 'var(--text-muted)' }}>Secure login for department officials</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '0.5rem', color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Official Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                required
                placeholder="officer@department.gov"
                style={{ 
                  width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', 
                  borderRadius: '0.5rem', color: 'var(--text)' 
                }}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Security Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                style={{ 
                  width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', 
                  borderRadius: '0.5rem', color: 'var(--text)' 
                }}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ padding: '1rem', marginTop: '1rem', justifyContent: 'center', width: '100%' }}
          >
            {loading ? 'Authenticating...' : 'Enter Portal'} 
            {!loading && <ChevronRight size={20} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            Return to Citizen Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
