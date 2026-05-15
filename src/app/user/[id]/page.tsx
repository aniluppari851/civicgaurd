'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, CheckCircle, Clock, AlertCircle, ArrowLeft, Calendar, ShieldCheck, Loader2, MessageSquare, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useSession } from 'next-auth/react';
import ConnectionModal from '@/components/ConnectionModal';
import { ProfileSkeleton } from '@/components/Skeleton';

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [data, setData] = useState<{ user: any, complaints: any[], stats: any, isFollowing: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Discovery Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  
  const router = useRouter();

  const openDiscovery = async (type: 'followers' | 'following') => {
    setIsModalOpen(true);
    setModalTitle(type === 'followers' ? 'Followers' : 'Following');
    setModalLoading(true);
    try {
      const res = await fetch(`/api/user/${params.id}/${type}`);
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

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/user/${params.id}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [params.id]);

  const handleFollow = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (!data) return;

    // Optimistic Update
    const wasFollowing = data.isFollowing;
    const originalFollowers = data.stats.followers;

    setData(prev => prev ? {
      ...prev,
      isFollowing: !wasFollowing,
      stats: {
        ...prev.stats,
        followers: wasFollowing ? originalFollowers - 1 : originalFollowers + 1
      }
    } : null);

    setFollowLoading(true);
    try {
      const res = await fetch(`/api/user/${params.id}/follow`, { method: 'POST' });
      const result = await res.json();
      
      if (!res.ok) {
        // Rollback on error
        setData(prev => prev ? {
          ...prev,
          isFollowing: wasFollowing,
          stats: {
            ...prev.stats,
            followers: originalFollowers
          }
        } : null);
        alert(`Follow failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      // Rollback on error
      setData(prev => prev ? {
        ...prev,
        isFollowing: wasFollowing,
        stats: {
          ...prev.stats,
          followers: originalFollowers
        }
      } : null);
      console.error('Failed to toggle follow', error);
      alert('Network error while trying to follow');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenChat = () => {
    if (!session) {
      router.push('/login');
      return;
    }
    const event = new CustomEvent('openChat', { 
      detail: { 
        id: data?.user.id, 
        name: data?.user.name, 
        image_url: data?.user.image_url 
      } 
    });
    window.dispatchEvent(event);
  };

  if (loading) return <ProfileSkeleton />;
  if (!data) return null;

  const isOwnProfile = session?.user?.id === params.id;
  const isOfficial = session?.user?.role === 'ADMIN' || session?.user?.role === 'DEPARTMENT_OFFICER';
  const isViewingOfficial = data.user.role === 'ADMIN' || data.user.role === 'DEPARTMENT_OFFICER';
  const canSeeContent = isOwnProfile || data.user.is_public || data.isFollowing || isOfficial;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="profile-grid" style={{ margin: '0' }}>
        
        {/* Profile Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass" 
            style={{ padding: '2.5rem', textAlign: 'center' }}
          >
            <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 1.5rem', borderRadius: '50%', border: '4px solid var(--primary)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              {data.user.image_url ? (
                <img src={data.user.image_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800 }}>
                  {data.user.name?.[0]}
                </div>
              )}
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{data.user.name}</h2>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', fontStyle: data.user.bio ? 'normal' : 'italic' }}>
              {data.user.bio || "This citizen is dedicated to a better city."}
            </p>

            {/* Social Counts */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
              <button 
                onClick={() => openDiscovery('followers')}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{data.stats.followers}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Followers</div>
              </button>
              <button 
                onClick={() => openDiscovery('following')}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{data.stats.following}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Following</div>
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {!isOwnProfile && !isOfficial && (
                <>
                  <button 
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={data.isFollowing ? "btn btn-secondary" : "btn btn-primary"}
                    style={{ 
                      width: '100%', 
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: followLoading ? 0.8 : 1,
                      background: data.isFollowing ? 'var(--bg-card)' : 'var(--primary)',
                      border: data.isFollowing ? '1px solid var(--border)' : 'none',
                      cursor: followLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {followLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : data.isFollowing ? (
                      <>
                        <CheckCircle size={18} />
                        <span>Following</span>
                      </>
                    ) : (
                      <span>Follow</span>
                    )}
                  </button>

                  {canSeeContent && !isViewingOfficial && (
                    <button 
                      onClick={handleOpenChat}
                      className="btn btn-secondary"
                      style={{ 
                        width: '100%', 
                        borderRadius: '0.5rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <MessageSquare size={18} color="var(--primary)" />
                      <span>Message</span>
                    </button>
                  )}
                </>
              )}
              {isOfficial && (
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Management accounts cannot follow or message citizens.
                </div>
              )}
            </div>

            <style jsx>{`
              .animate-spin {
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Calendar size={14} />
                <span>Joined {new Date(data.user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700 }}>
                <ShieldCheck size={14} />
                <span>VERIFIED {data.user.role === 'DEPARTMENT_OFFICER' ? 'OFFICER' : data.user.role === 'ADMIN' ? 'ADMIN' : 'CITIZEN'}</span>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{data.stats.reports}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Reports</div>
            </div>
            <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{data.stats.resolved}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resolved</div>
            </div>
          </div>
        </div>

        {/* Contribution Feed */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass" 
          style={{ padding: '2.5rem' }}
        >
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2.5rem' }}>Public Contributions</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {!canSeeContent ? (
              <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Lock size={48} style={{ opacity: 0.2 }} />
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>This profile is private</p>
                  <p style={{ fontSize: '0.9rem' }}>Follow this citizen to see their contributions and send messages.</p>
                </div>
                <button onClick={handleFollow} className="btn btn-primary" style={{ marginTop: '1rem' }}>Follow to Access</button>
              </div>
            ) : data.complaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>No public contributions yet.</div>
            ) : (
              data.complaints.map((c) => (
                <Link href={`/complaint/${c.id}`} key={c.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="glass" style={{ 
                    padding: '1.5rem', 
                  background: 'var(--bg)', 
                  border: '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{c.title || c.description.substring(0, 40) + '...'}</h4>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '4px', 
                        fontSize: '0.65rem', 
                        fontWeight: 800,
                        background: c.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: c.status === 'RESOLVED' ? 'var(--success)' : 'var(--warning)'
                      }}>
                        {c.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> {new Date(c.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={14} color="var(--danger)" /> {c.address?.substring(0, 40)}...
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

      </div>

      <ConnectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        users={modalUsers}
        loading={modalLoading}
        isOwnProfile={session?.user?.id === params.id}
        onRemoveUser={(userId) => {
          setModalUsers(prev => prev.filter(u => u.id !== userId));
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              stats: {
                ...prev.stats,
                followers: modalTitle === 'Followers' ? Math.max(0, prev.stats.followers - 1) : prev.stats.followers,
                following: modalTitle === 'Following' ? Math.max(0, prev.stats.following - 1) : prev.stats.following,
              }
            };
          });
        }}
      />
    </div>
  );
}
