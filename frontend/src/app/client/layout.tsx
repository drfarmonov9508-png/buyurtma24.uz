'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  History, Star, Store, LogOut,
  ChevronLeft, ChevronRight, Menu, ShoppingBasket, Dumbbell
} from 'lucide-react';

const CLIENT_NAV = [
  { href: '/client/places?type=food', key: 'food', label: 'Restoran & Kafelar', icon: Store },
  { href: '/client/places?type=market', key: 'market', label: 'Supermarketlar', icon: ShoppingBasket },
  { href: '/client/sport', key: 'sport', label: "Sport o'yinlari", icon: Dumbbell },
  { href: '/client/history', key: 'history', label: 'Ilova tarixi', icon: History },
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
    <div className="relative flex min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        'h-screen flex flex-col overflow-hidden border-r border-gray-100 bg-white/95 backdrop-blur-xl transition-all duration-300 ease-out dark:border-gray-800 dark:bg-slate-950/95',
        collapsed ? 'w-20' : 'w-72',
        'lg:relative',
        'max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:h-screen max-lg:z-50',
        mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
      )}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800">
          {!collapsed && (
            <Link href="/client" className="flex items-center gap-2.5">
              <div className="w-10 h-10 flex items-center justify-center rounded-3xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-950">
                B24
              </div>
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">Buyurtma24</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mijoz paneli</p>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800 lg:inline-flex"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          {CLIENT_NAV.map(({ href, key, label, icon: Icon }) => {
            const baseHref = href.split('?')[0];
            const isActive = pathname === baseHref || (baseHref !== '/client' && pathname.startsWith(baseHref));
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

        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          {!collapsed && user && (
            <div className="rounded-3xl bg-slate-50 px-3 py-3 dark:bg-gray-900">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.phone}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'sidebar-item-inactive mt-3 w-full',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogOut size={18} className="text-red-400 flex-shrink-0" />
            {!collapsed && <span className="text-red-500">Chiqish</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto lg:ml-0 xl:ml-0">
        <div className="lg:hidden flex items-center h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
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
