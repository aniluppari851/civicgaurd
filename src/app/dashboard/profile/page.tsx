'use client';

import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, MapPin, CheckCircle, Clock, AlertCircle, ArrowLeft, Camera, MoreVertical, Trash2, Loader2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ConnectionModal from '@/components/ConnectionModal';
import Skeleton, { CardSkeleton } from '@/components/Skeleton';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [socialStats, setSocialStats] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  
  // Discovery Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openDiscovery = async (type: 'followers' | 'following') => {
    if (!session?.user?.id) return;
    setIsModalOpen(true);
    setModalTitle(type === 'followers' ? 'My Followers' : 'Following');
    setModalLoading(true);
    try {
      const res = await fetch(`/api/user/${session.user.id}/${type}`);
      if (res.ok) {
        const users = await res.json();
        setModalUsers(users);
      }
    } catch (error) {
      console.error('Failed to fetch connections', error);
    } finally {
      setModalLoading(false);
    }
  };
  const [editData, setEditData] = useState({ name: '', bio: '', image_url: '' });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setEditData({
        name: session.user.name || '',
        bio: (session.user as any).bio || '',
        image_url: session.user.image || ''
      });
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    if (!session?.user?.id) return;
    try {
      // Fetch both complaints and social stats
      const [compRes, userRes] = await Promise.all([
        fetch('/api/complaints'),
        fetch(`/api/user/${session.user.id}?t=${Date.now()}`)
      ]);

      if (compRes.ok) {
        const data = await compRes.json();
        const myData = data.filter((c: any) => c.citizen_id === session.user.id);
        setComplaints(myData);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setSocialStats(userData.stats);
      }
    } catch (error) {
      console.error('Failed to fetch profile data', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload');
      setEditData({ ...editData, image_url: data.url });
      setZoom(1);
      setPosition({ x: 50, y: 50 });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCroppedImg = async () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = editData.image_url;
    await new Promise(resolve => img.onload = resolve);

    const canvas = document.createElement('canvas');
    const size = 400; // Fixed size for profile photos
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Calculate source dimensions based on zoom and position
    const aspect = img.width / img.height;
    let sw, sh, sx, sy;

    if (aspect > 1) { // Landscape
      sh = img.height / zoom;
      sw = sh;
      sy = (img.height - sh) * (position.y / 100);
      sx = (img.width - sw) * (position.x / 100);
    } else { // Portrait
      sw = img.width / zoom;
      sh = sw;
      sx = (img.width - sw) * (position.x / 100);
      sy = (img.height - sh) * (position.y / 100);
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    
    return new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9);
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalImageUrl = editData.image_url;

      // Only crop and re-upload if they adjusted something or it's a new photo
      if (editData.image_url && (zoom !== 1 || position.x !== 50 || position.y !== 50)) {
        const blob = await getCroppedImg();
        if (blob) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok) finalImageUrl = uploadData.url;
        }
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editData, image_url: finalImageUrl })
      });
      
      if (res.ok) {
        // Pass the new data to the update function
        await update({
          name: editData.name,
          image_url: finalImageUrl,
          bio: editData.bio
        });
        
        window.location.reload(); // Still doing a hard reload for safety
        setIsEditing(false);
      }
    } catch (err: any) {
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, complaintId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      setActiveMenuId(null);
      return;
    }

    setDeletingId(complaintId);
    setActiveMenuId(null);
    
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComplaints(prev => prev.filter(c => c.id !== complaintId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete complaint');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting the complaint');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === 'RESOLVED').length,
    pending: complaints.filter(c => c.status === 'PENDING').length
  };

  if (!session) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px' }}>
          Please login to view and manage your personal profile, connections, and activity.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
          Login to Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!isEditing && (
            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
          <button 
            className="btn btn-secondary" 
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = '/login';
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            title="Log out of your account"
          >
            <LogOut size={16} /> <span className="hide-on-mobile">Logout</span>
          </button>
        </div>
      </div>

      <div className={isEditing ? "" : "profile-grid"} style={{ maxWidth: isEditing ? '600px' : 'none', margin: isEditing ? '0 auto' : '0' }}>
        
        {/* Profile Card / Edit Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass" 
            style={{ padding: '2.5rem' }}
          >
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center' }}>Update Profile</h2>
                
                {/* Photo Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div 
                    style={{ position: 'relative', cursor: editData.image_url ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
                    onMouseDown={() => editData.image_url && setIsDragging(true)}
                    onMouseMove={(e) => {
                      if (!isDragging || !editData.image_url) return;
                      const sensitivity = 0.5;
                      setPosition(prev => ({
                        x: Math.max(0, Math.min(100, prev.x - e.movementX * sensitivity)),
                        y: Math.max(0, Math.min(100, prev.y - e.movementY * sensitivity))
                      }));
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  >
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--primary)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                      {editData.image_url ? (
                        <img 
                          src={editData.image_url} 
                          draggable={false}
                          style={{ 
                            width: '100%', height: '100%', objectFit: 'cover', 
                            objectPosition: `${position.x}% ${position.y}%`,
                            transform: `scale(${zoom})`,
                            transition: isDragging ? 'none' : 'all 0.2s'
                          }} 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Camera size={40} color="var(--text-muted)" />
                        </div>
                      )}
                    </div>
                    <label style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'var(--primary)', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Camera size={18} color="white" />
                      <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  {editData.image_url && (
                    <div style={{ width: '200px' }}>
                      <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                      <div style={{ fontSize: '0.65rem', textAlign: 'center', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Drag photo to center</div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Full Name</label>
                  <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ padding: '0.75rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--text)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} placeholder="Tell us about your mission..." rows={3} style={{ padding: '0.75rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--text)', resize: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>{loading ? 'Saving...' : 'Save Changes'}</button>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 1.5rem', borderRadius: '50%', border: '4px solid var(--primary)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                  {session.user.image ? (
                    <img src={session.user.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800 }}>
                      {session.user.name?.[0]}
                    </div>
                  )}
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{session.user.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', fontStyle: (session.user as any).bio ? 'normal' : 'italic' }}>
                  {(session.user as any).bio || "No bio added yet. Tell us about your civic mission!"}
                </p>

                {/* Social Counts */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
                  <button 
                    onClick={() => openDiscovery('followers')}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{socialStats.followers}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Followers</div>
                  </button>
                  <button 
                    onClick={() => openDiscovery('following')}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{socialStats.following}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Following</div>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  <Mail size={16} />
                  <span>{session.user.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <span style={{ padding: '0.4rem 1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>{session.user.role}</span>
                  <span style={{ padding: '0.4rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>VERIFIED</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Stats Grid */}
          {!isEditing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.total}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Reports</div>
              </div>
              <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{stats.resolved}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resolved</div>
              </div>
            </div>
          )}
        </div>

        {/* Complaints Feed */}
        {!isEditing && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass" 
            style={{ padding: 'clamp(1rem, 5vw, 2.5rem)' }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)', gap: '0.5rem' }}>
              <h3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 700 }}>My Contribution History</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Showing {complaints.length} reports</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : complaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'clamp(2rem, 5vw, 5rem)', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem' }}>
                  <AlertCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No reports yet</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>You haven't filed any complaints yet. Start making an impact!</p>
                  <Link href="/dashboard/report" className="btn btn-primary">File First Report</Link>
                </div>
              ) : (
                complaints.map((c) => (
                  <Link href={`/complaint/${c.id}`} key={c.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="glass" style={{ 
                      padding: 'clamp(1rem, 3vw, 1.5rem)', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      {/* 3 Dots Menu Button - Top Left */}
                      <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10 }}>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === c.id ? null : c.id);
                          }}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--text-muted)', 
                            cursor: 'pointer',
                            padding: '0.2rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          {deletingId === c.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <MoreVertical size={18} />
                          )}
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === c.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass"
                            style={{ 
                              position: 'absolute', 
                              top: '100%', 
                              left: 0, 
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              minWidth: '120px',
                              zIndex: 20,
                              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                              background: 'var(--bg-card)'
                            }}
                          >
                            <button 
                              onClick={(e) => handleDelete(e, c.id)}
                              style={{ 
                                width: '100%', 
                                padding: '0.6rem 0.8rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.6rem', 
                                color: 'var(--danger)', 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                borderRadius: '0.4rem',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingLeft: '1.75rem' }}>
                        <h4 style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', fontWeight: 700, flex: 1, minWidth: '150px' }}>{c.title || c.description.substring(0, 40) + '...'}</h4>
                        <span style={{ 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '4px', 
                          fontSize: '0.65rem', 
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          background: c.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: c.status === 'RESOLVED' ? 'var(--success)' : 'var(--warning)'
                        }}>
                          {c.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', paddingLeft: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} /> {new Date(c.created_at).toLocaleDateString()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={14} color="var(--danger)" /> {c.address?.substring(0, 30)}...
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}

      </div>

      <ConnectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        users={modalUsers}
        loading={modalLoading}
        isOwnProfile={true}
        onRemoveUser={(userId) => {
          setModalUsers(prev => prev.filter(u => u.id !== userId));
          setSocialStats(prev => ({
            ...prev,
            followers: modalTitle === 'My Followers' ? Math.max(0, prev.followers - 1) : prev.followers,
            following: modalTitle === 'Following' ? Math.max(0, prev.following - 1) : prev.following,
          }));
        }}
      />
    </div>
  );
}
