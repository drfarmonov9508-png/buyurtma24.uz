'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, History, Star, Store, LogOut,
  ChevronLeft, ChevronRight, UtensilsCrossed, Menu
} from 'lucide-react';

const CLIENT_NAV = [
  { href: '/client', key: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { href: '/client/history', key: 'history', label: 'Buyurtma tarixi', icon: History },
  { href: '/client/places', key: 'places', label: 'Tashkilotlar', icon: Store },
  { href: '/client/ratings', key: 'ratings', label: 'Baholarim', icon: Star },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Tizimdan chiqdingiz");
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 z-50',
        collapsed ? 'w-16' : 'w-64',
        'max-lg:fixed max-lg:left-0 max-lg:top-0',
        mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-800">
          {!collapsed && (
            <Link href="/client" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600">Buyurtma24</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 ml-auto max-lg:hidden"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {CLIENT_NAV.map(({ href, key, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/client' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-gray-100 dark:border-gray-800">
          {!collapsed && user && (
            <div className="px-3 py-2 mb-2 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.phone}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'sidebar-item-inactive w-full',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogOut size={18} className="text-red-400 flex-shrink-0" />
            {!collapsed && <span className="text-red-500">Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <Menu size={22} />
          </button>
          <span className="ml-3 font-bold text-gray-900 dark:text-white">Buyurtma24</span>
        </div>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
