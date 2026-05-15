'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  if (status === 'loading') return null;

  // Hide footer on admin and department routes
  const isAdminRoute = pathname?.startsWith('/admin');
  const isDeptRoute = pathname?.startsWith('/department');

  // Also hide if the logged-in user is an Admin or Officer
  const isManagementUser = session?.user?.role === 'ADMIN' || session?.user?.role === 'OFFICER';
  
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  
  if (isAdminRoute || isDeptRoute || isManagementUser || isAuthRoute) {
    return null;
  }

  return (
    <footer className="container" style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
      <p>&copy; 2026 CivicGuard. Empowering citizens through transparency.</p>
    </footer>
  );
}
