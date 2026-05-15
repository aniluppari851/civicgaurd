'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, User as UserIcon, Search, Loader2, Pin, BellOff, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Conversation {
  user: {
    id: string;
    name: string;
    image_url?: string;
  };
  lastMessage: {
    content: string;
    type: string;
    created_at: string;
    sender_id: string;
    read_at?: string;
  };
  settings: {
    is_pinned: boolean;
    is_muted: boolean;
  };
}

interface MessengerHubProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: { id: string, name: string, image_url?: string }) => void;
}

export default function MessengerHub({ isOpen, onClose, onSelectUser }: MessengerHubProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Context Menu States
  const [contextMenu, setContextMenu] = useState<{ userId: string, x: number, y: number, isPinned: boolean, isMuted: boolean } | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      if (res.ok) {
        let data = await res.json();
        
        // LocalStorage Fallback Merge
        try {
          const localSettings = JSON.parse(localStorage.getItem(`chat_settings_${session?.user?.id}`) || '{}');
          
          data = data.map((conv: any) => {
            const local = localSettings[conv.user.id];
            if (local) {
              return {
                ...conv,
                settings: {
                  is_pinned: local.is_pinned !== undefined ? local.is_pinned : conv.settings.is_pinned,
                  is_muted: local.is_muted !== undefined ? local.is_muted : conv.settings.is_muted,
                  is_hidden: local.is_hidden !== undefined ? local.is_hidden : false
                }
              };
            }
            return conv;
          }).filter((conv: any) => !conv.settings.is_hidden);
          
          // Re-sort in case local storage changed pinned status
          data.sort((a: any, b: any) => {
            if (a.settings.is_pinned && !b.settings.is_pinned) return -1;
            if (!a.settings.is_pinned && b.settings.is_pinned) return 1;
            return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
          });
        } catch (e) {}

        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 10000); // Less frequent polling for hub
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const filteredConversations = conversations.filter(c => 
    c.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = async (action: 'PIN' | 'MUTE' | 'HIDE', value: boolean, userId: string) => {
    setContextMenu(null);
    
    // Save to LocalStorage Fallback immediately
    try {
      const localKey = `chat_settings_${session?.user?.id}`;
      const localSettings = JSON.parse(localStorage.getItem(localKey) || '{}');
      if (!localSettings[userId]) localSettings[userId] = {};
      
      if (action === 'PIN') localSettings[userId].is_pinned = value;
      if (action === 'MUTE') localSettings[userId].is_muted = value;
      if (action === 'HIDE') localSettings[userId].is_hidden = value;
      
      localStorage.setItem(localKey, JSON.stringify(localSettings));
    } catch (e) {}

    // Optimistic UI update
    if (action === 'HIDE') {
      setConversations(prev => prev.filter(c => c.user.id !== userId));
    } else {
      setConversations(prev => {
        const newConvs = [...prev];
        const idx = newConvs.findIndex(c => c.user.id === userId);
        if (idx !== -1) {
          if (action === 'PIN') newConvs[idx].settings.is_pinned = value;
          if (action === 'MUTE') newConvs[idx].settings.is_muted = value;
        }
        // Re-sort
        return newConvs.sort((a, b) => {
          if (a.settings.is_pinned && !b.settings.is_pinned) return -1;
          if (!a.settings.is_pinned && b.settings.is_pinned) return 1;
          return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
        });
      });
    }

    try {
      await fetch('/api/messages/conversations/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ other_user_id: userId, action, value })
      });
    } catch (err) {
      console.error('Failed to update chat setting', err);
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
              background: 'rgba(0,0,0,0.5)', 
              backdropFilter: 'blur(4px)',
              zIndex: 998 
            }}
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass chat-window-mobile"
            style={{ 
              position: 'fixed', 
              top: 0, 
              right: 0, 
              width: '100%',
              maxWidth: '400px', 
              height: '100dvh', 
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
              borderRadius: '2rem 0 0 2rem',
              borderLeft: '1px solid var(--border)'
            }}
          >
            <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <MessageSquare size={24} color="var(--primary)" /> Messenger
                </h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem 0.75rem 3rem', 
                    background: 'var(--bg)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '0.75rem',
                    color: 'var(--text)'
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <MessageSquare size={48} style={{ opacity: 0.2 }} />
                  </div>
                  <p>No conversations yet. Start a chat from a citizen's profile!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.user.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ 
                          userId: conv.user.id, 
                          x: e.clientX, 
                          y: e.clientY,
                          isPinned: conv.settings.is_pinned,
                          isMuted: conv.settings.is_muted
                        });
                      }}
                      onTouchStart={(e) => {
                        setIsLongPressing(false);
                        const touch = e.touches[0];
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                        longPressTimer.current = setTimeout(() => {
                          setIsLongPressing(true);
                          setContextMenu({ 
                            userId: conv.user.id, 
                            x: touch.clientX, 
                            y: touch.clientY,
                            isPinned: conv.settings.is_pinned,
                            isMuted: conv.settings.is_muted
                          });
                        }, 500);
                      }}
                      onTouchEnd={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      }}
                      onTouchMove={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      }}
                      onClick={() => {
                        if (isLongPressing) return;
                        onSelectUser(conv.user);
                        onClose();
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        padding: '1rem', 
                        borderRadius: '1rem',
                        border: 'none',
                        background: conv.settings.is_pinned ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.2s',
                        color: 'inherit',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = conv.settings.is_pinned ? 'rgba(99, 102, 241, 0.05)' : 'transparent'}
                    >
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden', flexShrink: 0 }}>
                        {conv.user.image_url ? (
                          <img src={conv.user.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                            {conv.user.name[0]}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {conv.user.name}
                            {conv.settings.is_pinned && <Pin size={12} color="var(--primary)" style={{ transform: 'rotate(45deg)' }} />}
                            {conv.settings.is_muted && <BellOff size={12} color="var(--text-muted)" />}
                            {conv.lastMessage.sender_id !== session?.user?.id && !conv.lastMessage.read_at && !conv.settings.is_muted && (
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></div>
                            )}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(conv.lastMessage.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: (conv.lastMessage.sender_id !== session?.user?.id && !conv.lastMessage.read_at) ? 'var(--text)' : 'var(--text-muted)', 
                          fontWeight: (conv.lastMessage.sender_id !== session?.user?.id && !conv.lastMessage.read_at) ? 700 : 400,
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {conv.lastMessage.sender_id === session?.user?.id ? 'You: ' : ''}
                          {conv.lastMessage.type === 'TEXT' ? conv.lastMessage.content : '[Attachment]'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Context Menu Overlay */}
          {contextMenu && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 10000 }} 
                onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass"
                style={{
                  position: 'fixed',
                  left: Math.min(contextMenu.x, window.innerWidth - 200),
                  top: Math.min(contextMenu.y, window.innerHeight - 150),
                  zIndex: 10001,
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  minWidth: '180px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  border: '1px solid var(--border)'
                }}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction('PIN', !contextMenu.isPinned, contextMenu.userId); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Pin size={16} /> {contextMenu.isPinned ? 'Unpin' : 'Pin'} Chat
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction('MUTE', !contextMenu.isMuted, contextMenu.userId); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <BellOff size={16} /> {contextMenu.isMuted ? 'Unmute' : 'Mute'} Notifications
                </button>
                <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }} />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction('HIDE', true, contextMenu.userId); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', textAlign: 'left', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Trash2 size={16} /> Delete Chat
                </button>
              </motion.div>
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
