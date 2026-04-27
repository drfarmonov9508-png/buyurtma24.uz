'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    switch (user.role.toLowerCase()) {
      case 'superadmin': router.replace('/superadmin'); break;
      case 'cafe_admin': router.replace('/admin'); break;
      case 'cashier': router.replace('/cashier'); break;
      case 'waiter': router.replace('/waiter'); break;
      case 'kitchen': router.replace('/kitchen'); break;
      default: router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
