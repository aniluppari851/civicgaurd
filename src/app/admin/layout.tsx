'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, AlertCircle, Settings, LogOut, Shield, Map as MapIcon, History, Bell } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session) return;

    const fetchNotifications = () => {
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
          }
        })
        .catch(err => console.error('Notification fetch error:', err));
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [session]);

  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if accessing protected route without being an admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (pathname !== '/admin/login') {
      if (!session || session.user?.role !== 'ADMIN') {
        router.push('/admin/login');
      }
    }
  }, [session, status, pathname, router]);

  // If loading or redirecting, show nothing or a loader
  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin/dashboard' },
    { label: 'Complaints', icon: <AlertCircle size={20} />, href: '/admin/dashboard' },
    { label: 'Live Map', icon: <MapIcon size={20} />, href: '/admin/map' },
    { label: 'Users', icon: <Users size={20} />, href: '/admin/users' },
    { label: 'Audit Logs', icon: <History size={20} />, href: '/admin/audit-logs' },
    { label: 'Settings', icon: <Settings size={20} />, href: '/admin/settings' },
  ];

  const renderContent = () => {
    if (status === 'loading' || (pathname !== '/admin/login' && (!session || session.user?.role !== 'ADMIN'))) {
      return <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Authenticating...</div>;
    }
    return children;
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="portal-shell" style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', width: '100%', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      <aside className="desktop-only" style={{ width: '280px', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={28} color="var(--danger)" />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Admin Panel</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transparent CMS</span>
          </div>
        </div>

        <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.label} href={item.href} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                padding: '1rem 1.25rem', 
                borderRadius: '0.5rem',
                background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                color: isActive ? 'var(--danger)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s'
              }}>
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = '/';
            }}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              padding: '1rem 1.25rem', 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <LogOut size={20} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0, height: '100dvh', paddingBottom: '80px', width: '100%' }}>
        {/* Topbar */}
        <header className="admin-header" style={{ 
          height: '70px', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          background: 'var(--bg)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{pathname?.split('/').pop()?.toUpperCase() || 'ADMIN'}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="desktop-only"><ThemeToggle /></div>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <Link href="/admin/notifications" style={{ color: 'var(--text)' }}>
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
                    border: '2px solid var(--bg)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="desktop-only" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{session?.user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>System Admin</div>
              </div>
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--danger)' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {session?.user?.name?.[0]}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content-wrapper" style={{ width: '100%', boxSizing: 'border-box' }}>
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Navbar */}
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
        {navItems.slice(0, 4).map(item => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.2rem', 
                textDecoration: 'none', 
                color: isActive ? 'var(--danger)' : 'var(--text-muted)',
                flex: 1
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
            </Link>
          );
        })}
        <button 
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = '/';
          }}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '0.2rem', 
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            flex: 1,
            cursor: 'pointer'
          }}
        >
          <LogOut size={20} />
          <span style={{ fontSize: '0.6rem', fontWeight: 500 }}>Logout</span>
        </button>
      </div>
    </div>
  );
}
