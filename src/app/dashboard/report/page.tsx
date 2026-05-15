'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Send, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function ReportIssue() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: { lat: 0, lng: 0, address: '' }
  });

  const categories = [
    'Sanitation', 'Roads & Infrastructure', 'Water Supply', 'Electricity', 'Public Safety', 'Others'
  ];

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    try {
      const { supabase } = await import('@/lib/supabase');
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('complaints')
        .upload(fileName, imageFile);

      if (error) {
        console.error('Upload error:', error);
        throw new Error('Failed to upload image. Did you create the public "complaints" bucket?');
      }

      const { data: publicUrlData } = supabase.storage
        .from('complaints')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          lat: formData.location.lat,
          lng: formData.location.lng,
          address: formData.location.address || 'User specified location',
          image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit complaint');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem' }}>Report an Issue</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'clamp(1.5rem, 5vw, 3rem)', fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
          Provide clear details to help us resolve the issue faster.
        </p>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="grid" style={{ 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          alignItems: 'start',
          gap: '2rem'
        }}>
          <form onSubmit={handleSubmit} className="glass" style={{ 
            padding: 'clamp(1.25rem, 5vw, 2.5rem)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Issue Title</label>
              <input 
                type="text" 
                placeholder="e.g., Pothole in Main Street"
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  background: 'var(--bg)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)'
                }}
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Category</label>
              <select 
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  background: 'var(--bg)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)'
                }}
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="" disabled style={{ background: 'var(--bg-card)', color: 'var(--text)' }}>Select Category</option>
                {categories.map(c => <option key={c} value={c} style={{ background: 'var(--bg-card)', color: 'var(--text)' }}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Detailed Description</label>
              <textarea 
                placeholder="Describe the issue in detail..."
                rows={5}
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  background: 'var(--bg)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)',
                  resize: 'vertical'
                }}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontWeight: 600 }}>Attach Images</label>
              <label style={{ 
                border: '2px dashed var(--border)', 
                borderRadius: '1rem', 
                padding: 'clamp(1rem, 5vw, 2rem)', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                <Camera size={32} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {imageFile ? imageFile.name : 'Click to upload evidence'}
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Location (Geo-tagging)</label>
              <div style={{ 
                height: 'clamp(250px, 40vh, 400px)', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '1rem', 
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <MapPicker 
                  onLocationSelect={(loc) => setFormData({ ...formData, location: { ...formData.location, lat: loc.lat, lng: loc.lng } })} 
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {formData.location.lat ? `Selected Coordinates: ${formData.location.lat.toFixed(4)}, ${formData.location.lng.toFixed(4)}` : 'Click on the map to pin the location.'}
              </p>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
              <Send size={20} />
              <span>{loading ? 'Submitting...' : 'Submit Complaint'}</span>
            </button>
          </form>

          {/* Guidelines / Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--warning)' }}>
                <AlertTriangle size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Safety Notice</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                If this is an immediate life-threatening emergency, please call emergency services directly.
              </p>
            </div>

            <div className="glass" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Submission Tips</h4>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li>Take clear photos from multiple angles.</li>
                <li>Be specific about the location landmark.</li>
                <li>Mention how long the issue has persisted.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
