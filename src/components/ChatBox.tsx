'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Image as ImageIcon, File as FileIcon, Loader2, Download, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';

import Link from 'next/link';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  file_url?: string;
  created_at: string;
}

interface ChatBoxProps {
  recipientId: string;
  recipientName: string;
  recipientImage?: string;
  onClose: () => void;
}

export default function ChatBox({ recipientId, recipientName, recipientImage, onClose }: ChatBoxProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const markAsRead = async () => {
    try {
      await fetch('/api/messages/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: recipientId }),
      });
    } catch (error) {
      console.error('Failed to mark messages as read', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?otherUserId=${recipientId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        // If there are unread messages from the other user, mark as read
        const hasUnread = data.some((m: any) => m.sender_id === recipientId && !m.read_at);
        if (hasUnread) {
          markAsRead();
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling for simplicity, Supabase Realtime is better for prod
    return () => clearInterval(interval);
  }, [recipientId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: recipientId,
          content,
          type: 'TEXT'
        })
      });

      if (res.ok) {
        const sentMsg = await res.json();
        setMessages(prev => [...prev, sentMsg]);
      }
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'FILE') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const { url } = await res.json();
        
        // Send message with file URL
        const msgRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver_id: recipientId,
            content: type === 'IMAGE' ? 'Sent a photo' : `Sent a file: ${file.name}`,
            type,
            file_url: url
          })
        });

        if (msgRes.ok) {
          const sentMsg = await msgRes.json();
          setMessages(prev => [...prev, sentMsg]);
        }
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="glass chat-window-mobile"
      style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        width: '350px', 
        height: '500px', 
        display: 'flex', 
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        borderRadius: '1rem'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: '1rem', 
        background: 'var(--primary)', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        cursor: 'default'
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <Link href={`/user/${recipientId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', transition: 'opacity 0.2s' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', overflow: 'hidden' }}>
            {recipientImage ? (
              <img src={recipientImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800 }}>
                {recipientName[0]}
              </div>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{recipientName}</div>
        </Link>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          background: 'rgba(0,0,0,0.02)'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader2 className="animate-spin" size={24} color="var(--primary)" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2rem' }}>
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === session?.user?.id;
            return (
              <div 
                key={msg.id} 
                style={{ 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                <div style={{ 
                  padding: '0.75rem', 
                  borderRadius: isMe ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                  background: isMe ? 'var(--primary)' : 'var(--bg-card)',
                  color: isMe ? 'white' : 'var(--text)',
                  fontSize: '0.9rem',
                  boxShadow: 'var(--shadow)',
                  border: isMe ? 'none' : '1px solid var(--border)'
                }}>
                  {msg.type === 'TEXT' && msg.content}
                  {msg.type === 'IMAGE' && (
                    <img src={msg.file_url} alt="Shared photo" style={{ maxWidth: '100%', borderRadius: '0.5rem', cursor: 'zoom-in' }} onClick={() => window.open(msg.file_url, '_blank')} />
                  )}
                  {msg.type === 'FILE' && (
                    <a href={msg.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                      <FileIcon size={16} />
                      <span style={{ fontSize: '0.8rem', textDecoration: 'underline' }}>{msg.content.replace('Sent a file: ', '')}</span>
                      <Download size={14} />
                    </a>
                  )}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: isMe ? 'right' : 'left' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSendMessage}
        style={{ 
          padding: '1rem', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <label style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
            <ImageIcon size={20} />
            <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'IMAGE')} disabled={uploading} />
          </label>
          <label style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
            <Paperclip size={20} />
            <input type="file" hidden onChange={(e) => handleFileUpload(e, 'FILE')} disabled={uploading} />
          </label>
        </div>
        
        <input 
          type="text" 
          placeholder={uploading ? "Uploading..." : "Type a message..."}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={uploading}
          style={{ 
            flex: 1, 
            background: 'var(--bg)', 
            border: '1px solid var(--border)', 
            borderRadius: '100px', 
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            color: 'var(--text)'
          }}
        />
        
        <button 
          type="submit" 
          disabled={sending || uploading || (!newMessage.trim() && !sending)}
          style={{ 
            background: 'var(--primary)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '50%', 
            width: '36px', 
            height: '36px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: (sending || uploading || !newMessage.trim()) ? 0.7 : 1
          }}
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>

      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
