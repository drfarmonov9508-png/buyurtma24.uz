'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  History, Star, LogOut, ChevronLeft, ChevronRight, Menu, Dumbbell, Home,
} from 'lucide-react';

const CLIENT_NAV = [
  { href: '/client', key: 'home', label: 'Bosh', icon: Home },
  { href: '/client/sport', key: 'sport', label: 'Sport', icon: Dumbbell },
  { href: '/client/history', key: 'history', label: 'Tarix', icon: History },
  { href: '/client/ratings', key: 'ratings', label: 'Baho', icon: Star },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Chiqildi');
    router.push('/login');
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#060a10]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08),_transparent_50%)]" />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        'relative z-50 flex h-screen flex-col border-r border-white/[0.06] bg-[#0a1018]/95 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]',
        'max-lg:fixed max-lg:left-0 max-lg:top-0',
        mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
      )}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
          {!collapsed && (
            <Link href="/client" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-black text-[#060a10]">
                B24
              </div>
              <span className="font-semibold text-white">Sport</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white lg:inline-flex"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {CLIENT_NAV.map(({ href, label, icon: Icon }) => {
            const baseHref = href.split('?')[0];
            const isActive = pathname === baseHref || (baseHref !== '/client' && pathname.startsWith(baseHref));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80',
                  collapsed && 'justify-center px-2',
                )}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          {!collapsed && user && (
            <div className="mb-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <p className="truncate text-sm font-medium text-white">{user.firstName}</p>
              <p className="truncate text-xs text-white/40">{user.phone}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400',
              collapsed && 'justify-center px-2',
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center border-b border-white/[0.06] bg-[#0a1018]/80 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-white/60 hover:bg-white/5">
            <Menu size={22} />
          </button>
          <span className="ml-3 font-semibold text-white">Buyurtma24</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/[0.06] bg-[#0a1018]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
          {CLIENT_NAV.map(({ href, label, icon: Icon }) => {
            const baseHref = href.split('?')[0];
            const isActive = pathname === baseHref || (baseHref !== '/client' && pathname.startsWith(baseHref));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition',
                  isActive ? 'text-emerald-400' : 'text-white/40',
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="h-16 lg:hidden" />
      </main>
    </div>
  );
}
