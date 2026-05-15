'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { LayoutDashboard, AlertCircle, LogOut, Shield, Map as MapIcon, History, Building2, Bell } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const DeptContext = createContext<{
  selectedDept: any;
  setSelectedDept: (dept: any) => void;
  departments: any[];
}>({
  selectedDept: null,
  setSelectedDept: () => {},
  departments: [],
});

export const useDepartment = () => useContext(DeptContext);

export default function DepartmentLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (status === 'loading') return;
    if (pathname === '/department/login') return;

    if (!session || session.user?.role !== 'DEPARTMENT_OFFICER') {
      router.push('/login');
      return;
    }

    const fetchMyDepartments = async () => {
      try {
        const response = await fetch('/api/admin/departments');
        if (response.ok) {
          const allDepts = await response.json();
          const myDepts = allDepts.filter((d: any) => session.user.departments.includes(d.id));
          setDepartments(myDepts);
          
          // 1. Check Database selection first (bio field contains the locked ID)
          if (session.user.bio && session.user.bio.startsWith('DEPT_LOCK:')) {
            const lockedId = session.user.bio.replace('DEPT_LOCK:', '');
            const found = myDepts.find((d: any) => d.id === lockedId);
            if (found) {
              setSelectedDept(found);
              setLoading(false);
              return;
            }
          }

          // 2. Fallback to localStorage if needed
          const savedDeptId = localStorage.getItem(`dept_choice_${session.user.id}`);
          if (savedDeptId) {
            const found = myDepts.find((d: any) => d.id === savedDeptId);
            if (found) setSelectedDept(found);
          } else if (myDepts.length === 1) {
            setSelectedDept(myDepts[0]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyDepartments();
  }, [session, status, pathname, router]);

  const handleSelectDept = async (dept: any) => {
    setSelectedDept(dept);
    if (session?.user?.id) {
      localStorage.setItem(`dept_choice_${session.user.id}`, dept.id);
      
      // PERSIST TO DATABASE
      try {
        await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: session.user.id, bio: `DEPT_LOCK:${dept.id}` })
        });
      } catch (e) {
        console.error('Failed to lock department in DB:', e);
      }
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/department/dashboard' },
    { label: 'Map View', icon: <MapIcon size={20} />, href: '/department/map' },
  ];

  if (pathname === '/department/login') return <>{children}</>;

  return (
    <DeptContext.Provider value={{ selectedDept, setSelectedDept, departments }}>
      <div className="portal-shell" style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside className="desktop-only" style={{ width: '280px', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={28} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Officer Portal</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedDept?.name || 'Selecting...'}</span>
            </div>
          </div>

          <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.label} href={item.href} style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '0.5rem',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  textDecoration: 'none', fontWeight: isActive ? 600 : 400
                }}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: '1rem' }}>
            <button 
              onClick={async () => {
                if (session?.user?.id) localStorage.removeItem(`dept_choice_${session.user.id}`);
                await signOut({ callbackUrl: '/' });
              }} 
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        <main style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden', 
          minWidth: 0, 
          height: '100dvh', 
          paddingBottom: '90px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}>
          <header style={{ 
            height: '70px', 
            borderBottom: '1px solid var(--border)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 1rem', 
            background: 'var(--bg)', 
            position: 'sticky', 
            top: 0, 
            zIndex: 100,
            width: '100%',
            flexShrink: 0
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
              {pathname?.split('/').pop()?.toUpperCase() || 'PORTAL'}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="desktop-only"><ThemeToggle /></div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Link href="/department/notifications" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{ 
                      position: 'absolute', top: '-5px', right: '-5px', background: 'var(--primary)', 
                      color: 'white', borderRadius: '50%', width: '16px', height: '16px', 
                      fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontWeight: 700, border: '2px solid var(--bg)' 
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="desktop-only" style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{session?.user?.name || 'Officer'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{selectedDept?.name || 'Assigned'} Officer</div>
                </div>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontWeight: 'bold', fontSize: '0.85rem', color: 'white' 
                }}>
                  {session?.user?.name?.[0] || '?'}
                </div>
              </div>
            </div>
          </header>

          <div style={{ padding: '1rem', flex: 1, width: '100%', maxWidth: '100vw' }}>
            {status === 'loading' || (loading && !selectedDept) ? (
              <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner">Loading Portal...</div>
              </div>
            ) : !selectedDept && departments.length > 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 0' }}>
                <div className="glass" style={{ padding: '1.5rem', maxWidth: '90%', width: '100%', textAlign: 'center' }}>
                  <Building2 size={40} color="var(--primary)" style={{ marginBottom: '1.25rem' }} />
                  <h2 style={{ fontSize: '1.25rem' }}>Select Department</h2>
                  <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0', fontSize: '0.9rem' }}>Choose carefully. This selection is permanent for your account.</p>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                    ⚠️ One-time selection for this session.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {departments.map(dept => (
                      <button key={dept.id} onClick={() => handleSelectDept(dept)} className="btn btn-secondary" style={{ justifyContent: 'center', padding: '0.85rem' }}>
                        {dept.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : !selectedDept && departments.length === 0 && !loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
                <div className="glass" style={{ padding: '2rem', maxWidth: '90%', width: '100%', textAlign: 'center' }}>
                  <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
                  <h2>Access Restricted</h2>
                  <p style={{ color: 'var(--text-muted)', margin: '2rem 0' }}>No departments assigned. Please contact Admin.</p>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Logout</button>
                </div>
              </div>
            ) : children}
          </div>
        </main>

        {/* Mobile Nav */}
        <div className="mobile-only glass" style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: '70px', 
          zIndex: 10000, 
          borderRadius: '1.5rem 1.5rem 0 0', 
          padding: '0.5rem 1rem env(safe-area-inset-bottom)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-around', 
          background: 'var(--bg-card)',
          border: '1px solid var(--border)', 
          borderBottom: 'none',
          width: '100%',
          boxShadow: '0 -5px 20px rgba(0,0,0,0.1)'
        }}>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.label} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: isActive ? 'var(--primary)' : 'var(--text-muted)', flex: 1 }}>
                {item.icon}
                <span style={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </Link>
            );
          })}
          <button onClick={() => signOut({ callbackUrl: '/' })} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', color: 'var(--text-muted)', flex: 1, cursor: 'pointer' }}>
            <LogOut size={20} />
            <span style={{ fontSize: '0.6rem', fontWeight: 500 }}>Logout</span>
          </button>
        </div>
      </div>
    </DeptContext.Provider>
  );
}
