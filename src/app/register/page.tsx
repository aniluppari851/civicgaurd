'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Camera, Plus, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
export default function Register() {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', image_url: '', officer_code: '' });
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload');

      setFormData({ ...formData, image_url: data.url });
      setZoom(1);
      setPosition({ x: 50, y: 50 });
    } catch (err: any) {
      setError('Failed to upload photo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (formData.image_url) {
      setIsDragging(true);
      e.preventDefault();
    }
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !formData.image_url) return;

    const sensitivity = 0.5;
    setPosition(prev => ({
      x: Math.max(0, Math.min(100, prev.x - e.movementX * sensitivity)),
      y: Math.max(0, Math.min(100, prev.y - e.movementY * sensitivity))
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const regRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Registration failed');

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', overflow: 'hidden' }}>
      <style jsx>{`
        @media (max-width: 768px) {
          .auth-container { height: 100vh !important; padding: 0.5rem !important; overflow: hidden !important; }
          .auth-card { padding: 1rem !important; }
          .auth-title { font-size: 1.5rem !important; margin-bottom: 0 !important; }
          .auth-subtitle { margin-bottom: 0.5rem !important; }
          .auth-form { gap: 0.5rem !important; }
          .auth-input { padding: 0.5rem 1rem 0.5rem 2.5rem !important; }
          .auth-btn { padding: 0.75rem !important; margin-top: 0.5rem !important; }
          .auth-links { margin-top: 1rem !important; }
          .profile-upload-section { margin-bottom: 0.5rem !important; gap: 0.5rem !important; }
          .profile-circle { width: 80px !important; height: 80px !important; }
          .profile-icon { width: 24px !important; height: 24px !important; }
          .profile-label { font-size: 0.6rem !important; margin-top: 0.2rem !important; }
          .profile-zoom-controls { width: 150px !important; }
        }
      `}</style>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass auth-card" 
        style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}
      >
        <div className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 className="auth-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join the community for a better city</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '0.75rem', textAlign: 'center', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="profile-upload-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div 
              style={{ 
                position: 'relative',
                cursor: formData.image_url ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="profile-circle" style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.02)', 
                border: '3px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                userSelect: 'none'
              }}>
                {formData.image_url ? (
                  <img 
                    src={formData.image_url} 
                    alt="Profile" 
                    draggable={false}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      objectPosition: `${position.x}% ${position.y}%`,
                      transform: `scale(${zoom})`,
                      transition: isDragging ? 'none' : 'transform 0.2s ease, object-position 0.2s ease'
                    }} 
                  />
                ) : (
                  <label style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <Camera className="profile-icon" size={32} color="var(--text-muted)" />
                    <div className="profile-label" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Add Photo</div>
                    <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
              {formData.image_url && (
                <label style={{ 
                  position: 'absolute', 
                  bottom: '2px', 
                  right: '2px', 
                  background: 'var(--primary)', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}>
                  <Plus size={16} color="white" />
                  <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="John Doe"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.6rem 1rem 0.6rem 2.5rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)',
                  fontSize: '0.9rem'
                }}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                placeholder="john@example.com"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.6rem 1rem 0.6rem 2.5rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)',
                  fontSize: '0.9rem'
                }}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="••••••••"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.6rem 1rem 0.6rem 2.5rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)',
                  fontSize: '0.9rem'
                }}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>Officer Access Code (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Shield size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.7 }} />
              <input 
                type="text" 
                placeholder="For dept officers only"
                style={{ 
                  width: '100%', 
                  padding: '0.6rem 1rem 0.6rem 2.5rem', 
                  background: 'rgba(99, 102, 241, 0.05)', 
                  border: '1px solid rgba(99, 102, 241, 0.2)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)',
                  fontSize: '0.9rem'
                }}
                onChange={(e) => setFormData({ ...formData, officer_code: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary auth-btn" style={{ padding: '0.8rem', marginTop: '0.5rem', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating Account...' : 'Create Account'} 
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <p className="auth-links" style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Login here</Link>
        </p>
      </motion.div>
    </div>
  );
}
