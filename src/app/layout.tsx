import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CivicGuard | Transparent Complaint Management',
  description: 'A transparent platform for citizens to report and track civic issues.',
};

import ConditionalNavbar from '@/components/ConditionalNavbar';
import ConditionalFooter from '@/components/ConditionalFooter';
import MobileNavbar from '@/components/MobileNavbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ConditionalNavbar />
          <main>{children}</main>
          <MobileNavbar />
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
