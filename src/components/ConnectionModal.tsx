import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef } from 'react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: any[];
  loading: boolean;
  isOwnProfile?: boolean;
  onRemoveUser?: (userId: string) => void;
}

export default function ConnectionModal({ isOpen, onClose, title, users, loading, isOwnProfile, onRemoveUser }: ConnectionModalProps) {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleAction = async (user: any) => {
    if (!isOwnProfile) return;
    
    const isFollowers = title.toLowerCase().includes('followers');
    const actionText = isFollowers ? `remove ${user.name} as a follower` : `unfollow ${user.name}`;
    
    if (window.confirm(`Are you sure you want to ${actionText}?`)) {
      try {
        let res;
        if (isFollowers) {
          res = await fetch(`/api/user/${user.id}/remove-follower`, { method: 'POST' });
        } else {
          res = await fetch(`/api/user/${user.id}/follow`, { method: 'POST' });
        }
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Request failed');
        }
        
        if (onRemoveUser) onRemoveUser(user.id);
      } catch (err) {
        console.error('Failed to update connection', err);
        alert('An error occurred. Please try again.');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass"
              style={{
                width: '100%',
                maxWidth: '450px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Discovering citizens...</div>
                ) : users.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No connections found yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {users.map((user) => (
                      <div 
                        key={user.id}
                        onContextMenu={(e) => {
                          if (isOwnProfile) {
                            e.preventDefault();
                            handleAction(user);
                          }
                        }}
                        onTouchStart={() => {
                          setIsLongPressing(false);
                          if (!isOwnProfile) return;
                          if (longPressTimer.current) clearTimeout(longPressTimer.current);
                          longPressTimer.current = setTimeout(() => {
                            setIsLongPressing(true);
                            handleAction(user);
                          }, 500);
                        }}
                        onTouchEnd={() => {
                          if (longPressTimer.current) clearTimeout(longPressTimer.current);
                        }}
                        onTouchMove={() => {
                          if (longPressTimer.current) clearTimeout(longPressTimer.current);
                        }}
                        style={{ position: 'relative' }}
                      >
                        <div 
                          onClick={(e) => {
                            if (isLongPressing) {
                              e.preventDefault();
                              setIsLongPressing(false); // reset
                              return;
                            }
                            onClose();
                            window.location.href = `/user/${user.id}`;
                          }}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem', 
                            padding: '0.75rem', 
                            borderRadius: '0.75rem',
                            background: 'rgba(255,255,255,0.03)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            border: '1px solid transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        >
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                              {user.image_url ? (
                                <img src={user.image_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                                  {user.name?.[0]}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                                {user.bio || "Civic Contributor"}
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
