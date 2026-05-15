'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Home, LayoutDashboard, PlusSquare, Bell, User, MessageSquare, Search } from 'lucide-react';
import MessengerHub from './MessengerHub';
import ChatBox from './ChatBox';

export default function MobileNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Messenger States
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<{ id: string, name: string, image_url?: string } | null>(null);
  const [lastSeenHub, setLastSeenHub] = useState<number>(Date.now());

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
      const interval = setInterval(getNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session, lastSeenHub]);

  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

  useEffect(() => {
    // Reset optimistic path and close chats when the actual route changes
    setOptimisticPath(null);
    setIsHubOpen(false);
    setActiveChat(null);
  }, [pathname]);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/department') || pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Hide for management users, EXCEPT on the home page where they might need public nav
  if ((session?.user?.role === 'ADMIN' || session?.user?.role === 'DEPARTMENT_OFFICER') && pathname !== '/') {
    return null;
  }

  const NavItem = ({ href, icon: Icon, label, badgeCount }: any) => {
    const currentPath = optimisticPath || pathname;
    const isActive = currentPath === href;
    return (
      <Link 
        href={href} 
        prefetch={true}
        onClick={() => {
          setOptimisticPath(href);
          setIsHubOpen(false); // Close chat hub when switching tabs
          setActiveChat(null); // Close active chat when switching tabs
        }}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '0.2rem', 
          textDecoration: 'none', 
          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
          flex: 1,
          position: 'relative'
        }}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 700 : 500 }}>{label}</span>
        {badgeCount > 0 && (
          <span style={{ 
            position: 'absolute', top: '-2px', right: '25%', background: 'var(--danger)', 
            color: 'white', borderRadius: '50%', width: '16px', height: '16px', 
            fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, border: '2px solid var(--bg-card)'
          }}>
            {badgeCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <div className="mobile-only glass" style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: '70px', 
        zIndex: 1000, 
        borderRadius: '1.5rem 1.5rem 0 0',
        padding: '0.5rem 1rem env(safe-area-inset-bottom)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 -5px 20px rgba(0,0,0,0.1)',
        border: '1px solid var(--glass-border)',
        borderBottom: 'none'
      }}>
        <NavItem href="/dashboard" icon={Home} label="Home" />
        <NavItem href="/public-dashboard" icon={Search} label="Explore" />
        
        {/* Report Button - Centered & Prominent */}
        <Link 
          href="/dashboard/report" 
          prefetch={true}
          onClick={() => {
            setOptimisticPath('/dashboard/report');
            setIsHubOpen(false);
            setActiveChat(null);
          }}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            marginTop: '-30px',
            textDecoration: 'none'
          }}
        >
          <div style={{ 
            background: optimisticPath === '/dashboard/report' || pathname === '/dashboard/report' ? 'var(--primary-hover)' : 'var(--primary)', 
            padding: '1rem', 
            borderRadius: '50%', 
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: optimisticPath === '/dashboard/report' || pathname === '/dashboard/report' ? 'scale(0.95)' : 'scale(1)',
            transition: 'all 0.2s'
          }}>
            <PlusSquare size={28} />
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.3rem' }}>Report</span>
        </Link>

        {/* Messenger Hub Trigger */}
        <div 
          onClick={() => setIsHubOpen(true)}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '0.2rem', 
            color: isHubOpen ? 'var(--primary)' : 'var(--text-muted)',
            flex: 1,
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={24} />
          <span style={{ fontSize: '0.65rem', fontWeight: isHubOpen ? 700 : 500 }}>Chat</span>
          {unreadMessages > 0 && (
            <span style={{ 
              position: 'absolute', top: '-2px', right: '25%', background: 'var(--primary)', 
              color: 'white', borderRadius: '50%', width: '16px', height: '16px', 
              fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, border: '2px solid var(--bg-card)'
            }}>
              {unreadMessages}
            </span>
          )}
        </div>

        <NavItem href="/dashboard/profile" icon={User} label="Profile" badgeCount={unreadCount} />
      </div>

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
