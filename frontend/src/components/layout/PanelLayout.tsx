'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface PanelLayoutProps {
  children: React.ReactNode;
  title?: string;
  allowedRoles: string[];
}

export default function PanelLayout({ children, title, allowedRoles }: PanelLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, fetchMe } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      fetchMe();
    }
  }, [fetchMe, isAuthenticated]);

  useEffect(() => {
    const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());
    if (user && !normalizedAllowedRoles.includes(user.role.toLowerCase())) {
      router.replace('/login');
    }
  }, [user, allowedRoles, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity duration-300" onClick={() => setMobileOpen(false)} />
      )}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
