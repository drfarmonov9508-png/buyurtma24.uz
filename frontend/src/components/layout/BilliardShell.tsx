'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Table2, PackageOpen, BarChart2, LogOut,
  Menu, X, ChevronLeft, ChevronRight, Moon, Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { getInitials } from '@/lib/utils';

const NAV = [
  { href: '/billiard-admin?tab=dashboard', tab: 'dashboard', icon: LayoutDashboard },
  { href: '/billiard-admin?tab=tables', tab: 'tables', icon: Table2 },
  { href: '/billiard-admin?tab=inventory', tab: 'inventory', icon: PackageOpen },
  { href: '/billiard-admin?tab=analytics', tab: 'analytics', icon: BarChart2 },
];

export default function BilliardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, isAuthenticated, fetchMe } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) fetchMe();
  }, [fetchMe, isAuthenticated]);

  useEffect(() => {
    const allowed = ['billiard_admin', 'sport_admin', 'superadmin'];
    if (user && !allowed.includes(user.role.toLowerCase())) {
      router.replace('/login');
    }
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    toast.success('Chiqildi');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0a09]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400" />
      </div>
    );
  }

  const currentTab = searchParams?.get('tab') || 'dashboard';

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0c0a09]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.07),_transparent_45%)]" />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        'relative z-50 flex h-screen flex-col border-r border-white/[0.06] bg-[#141210]/95 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]',
        'max-lg:fixed max-lg:left-0 max-lg:top-0',
        mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
      )}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
          {!collapsed && (
            <Link href="/billiard-admin" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-black text-[#0c0a09]">
                B
              </div>
              <span className="font-semibold text-white">Billiard</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden rounded-lg p-2 text-white/40 hover:bg-white/5 lg:inline-flex">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-white/40 hover:bg-white/5 lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {NAV.map(({ href, tab, icon: Icon }) => {
            const isActive = pathname === '/billiard-admin' && currentTab === tab;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80',
                  collapsed && 'justify-center px-2',
                )}
              >
                <Icon size={18} />
                {!collapsed && (
                  <span>
                    {tab === 'dashboard' && 'Panel'}
                    {tab === 'tables' && 'Stollar'}
                    {tab === 'inventory' && 'Ombor'}
                    {tab === 'analytics' && 'Hisobot'}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          {!collapsed && (
            <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-[#0c0a09]">
                {getInitials(`${user.firstName} ${user.lastName}`)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user.firstName}</p>
                <p className="truncate text-xs text-white/40">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400/80 hover:bg-red-500/10',
              collapsed && 'justify-center',
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#141210]/80 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-white/60 hover:bg-white/5 lg:hidden">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl p-2 text-white/50 hover:bg-white/5 hover:text-white"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
