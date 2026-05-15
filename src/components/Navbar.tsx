'use client';

import Link from 'next/link';
import { Shield, LayoutDashboard, LogIn, UserPlus, LogOut, Bell, MessageSquare } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import MessengerHub from './MessengerHub';
import ChatBox from './ChatBox';
import UserSearch from './UserSearch';

export default function Navbar() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const pathname = usePathname();
  
  // Messenger States
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<{ id: string, name: string, image_url?: string } | null>(null);
  const [lastSeenHub, setLastSeenHub] = useState<number>(Date.now());

  useEffect(() => {
    setIsHubOpen(false);
    setActiveChat(null);
  }, [pathname]);

  useEffect(() => {
    if (session) {
      const getNotifications = () => {
        fetch('/api/notifications')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setUnreadCount(data.filter((n: any) => !n.is_read).length);
            }
          });
        
        fetch('/api/messages/conversations')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              // Only count as "new" if received after hub was last opened
              const unread = data.filter((c: any) => 
                c.lastMessage.sender_id !== session.user.id && 
                !c.lastMessage.read_at &&
                new Date(c.lastMessage.created_at).getTime() > lastSeenHub
              ).length;
              setUnreadMessages(unread);
            }
          });
      };

      getNotifications();
      const interval = setInterval(getNotifications, 60000); // Poll every 60s
      return () => clearInterval(interval);
    }
  }, [session, lastSeenHub]);

  // Handle Hub Opening
  useEffect(() => {
    if (isHubOpen) {
      setUnreadMessages(0);
      setLastSeenHub(Date.now());
    }
  }, [isHubOpen]);

  // Listen for a custom event to open a chat from anywhere
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      setActiveChat(e.detail);
    };
    const handleOpenHub = () => {
      setIsHubOpen(true);
    };
    window.addEventListener('openChat', handleOpenChat);
    window.addEventListener('openHub', handleOpenHub);
    return () => {
      window.removeEventListener('openChat', handleOpenChat);
      window.removeEventListener('openHub', handleOpenHub);
    };
  }, []);

  // Hide Navbar on admin and department routes to prevent navigation confusion
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/department')) {
    return null;
  }

  return (
    <>
      <nav className="glass desktop-only" style={{ 
        position: 'sticky', 
        top: '1rem', 
        margin: '1rem auto', 
        width: 'calc(100% - 2rem)', 
        maxWidth: '1200px',
        zIndex: 100,
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
          <Shield size={32} color="var(--primary)" />
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.025em' }}>
            Civic<span style={{ color: 'var(--primary)' }}>Guard</span>
          </span>
        </Link>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '400px', margin: '0 2rem' }}>
          <UserSearch />
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <ThemeToggle />
          <Link href="/public-dashboard" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 500 }}>
            Public Feed
          </Link>
          
          {session ? (
            <>
              <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>

              {/* Messenger Icon */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsHubOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <MessageSquare size={22} />
                  {unreadMessages > 0 && (
                    <span style={{ 
                      position: 'absolute', top: '-5px', right: '-5px', background: 'var(--primary)', 
                      color: 'white', borderRadius: '50%', width: '18px', height: '18px', 
                      fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, border: '2px solid var(--bg-color)'
                    }}>
                      {unreadMessages}
                    </span>
                  )}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Link href="/dashboard/notifications" style={{ color: 'var(--text)' }}>
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '-5px', 
                      right: '-5px', 
                      background: 'var(--danger)', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: '18px', 
                      height: '18px', 
                      fontSize: '0.65rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 700,
                      border: '2px solid var(--bg-color)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </div>
              <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
                  />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {session.user?.name?.[0] || 'U'}
                  </div>
                )}
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{session.user?.name}</span>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
              <Link href="/login" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogIn size={18} />
                <span>Login</span>
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                <UserPlus size={18} />
                <span>Join Us</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Messenger Components */}
      <MessengerHub 
        isOpen={isHubOpen} 
        onClose={() => setIsHubOpen(false)} 
        onSelectUser={(user) => setActiveChat(user)} 
      />
      
      {activeChat && (
        <ChatBox 
          recipientId={activeChat.id} 
          recipientName={activeChat.name} 
          recipientImage={activeChat.image_url} 
          onClose={() => {
            setActiveChat(null);
            setIsHubOpen(true); // Go back to hub
          }} 
        />
      )}
    </>
  );
}
