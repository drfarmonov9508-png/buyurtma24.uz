'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    if (!isAuthenticated) {
      fetchMe();
    }
  }, []);

  useEffect(() => {
    const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());
    if (user && !normalizedAllowedRoles.includes(user.role.toLowerCase())) {
      router.replace('/login');
    }
  }, [user, allowedRoles, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
