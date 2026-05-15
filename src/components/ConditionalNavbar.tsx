'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  if (status === 'loading') return null;

  // Hide navbar on admin and department routes
  const isAdminRoute = pathname?.startsWith('/admin');
  const isDeptRoute = pathname?.startsWith('/department');
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isManagementUser = session?.user?.role === 'ADMIN' || session?.user?.role === 'DEPARTMENT_OFFICER';
  
  // Allow on home page even for management
  if (isAdminRoute || isDeptRoute || isAuthRoute || (isManagementUser && pathname !== '/')) {
    return null;
  }

  return <Navbar />;
}
