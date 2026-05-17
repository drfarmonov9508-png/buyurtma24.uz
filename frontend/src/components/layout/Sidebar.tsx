'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Store, Users, BarChart2,
  Settings, LogOut, ChevronLeft, ChevronRight, Tag, Package,
  Table2, ClipboardList, Star, Percent, X
} from 'lucide-react';

type NavKey = 'dashboard' | 'categories' | 'products' | 'tables' | 'orders' | 'staff' | 'inventory' | 'discounts' | 'reports' | 'settings' | 'cafes' | 'subscriptions' | 'users' | 'analytics';

type NavItem = { href: string; key: NavKey; icon: any; label?: string };

const SUPERADMIN_NAV: NavItem[] = [
  { href: '/superadmin', key: 'dashboard', icon: LayoutDashboard },
  { href: '/superadmin/tenants', key: 'cafes', icon: Store },
  { href: '/superadmin/subscriptions', key: 'subscriptions', icon: Star },
  { href: '/superadmin/users', key: 'users', icon: Users },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', key: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', key: 'categories', icon: Tag },
  { href: '/admin/products', key: 'products', icon: Package },
  { href: '/admin/tables', key: 'tables', icon: Table2 },
  { href: '/admin/orders', key: 'orders', icon: ClipboardList },
  { href: '/admin/staff', key: 'staff', icon: Users },
  { href: '/admin/inventory', key: 'inventory', icon: Package },
  { href: '/admin/discounts', key: 'discounts', icon: Percent },
  { href: '/admin/reports', key: 'reports', icon: BarChart2 },
  { href: '/admin/settings', key: 'settings', icon: Settings },
];

const BILLIARD_NAV: NavItem[] = [
  { href: '/billiard-admin?view=dashboard', key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/billiard-admin?view=tables', key: 'tables', icon: Table2, label: 'Stollar' },
  { href: '/billiard-admin?view=inventory', key: 'inventory', icon: Package, label: 'Ombor' },
  { href: '/billiard-admin?view=analytics', key: 'analytics', icon: BarChart2, label: 'Tahlil' },
];

const CASHIER_NAV: NavItem[] = [
  { href: '/cashier', key: 'dashboard', icon: LayoutDashboard },
  { href: '/cashier/orders', key: 'orders', icon: ClipboardList },
];

const WAITER_NAV: NavItem[] = [
  { href: '/waiter', key: 'tables', icon: Table2 },
  { href: '/waiter/orders', key: 'orders', icon: ClipboardList },
];

const KITCHEN_NAV: NavItem[] = [
  { href: '/kitchen', key: 'orders', icon: ClipboardList },
];

const NAV_MAP: Record<string, NavItem[]> = {
  superadmin: SUPERADMIN_NAV,
  cafe_admin: ADMIN_NAV,
  cashier: CASHIER_NAV,
  waiter: WAITER_NAV,
  kitchen: KITCHEN_NAV,
  billiard_admin: BILLIARD_NAV,
  sport_admin: BILLIARD_NAV,
};

export default function Sidebar({ mobileOpen = false, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { tr } = useLang();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV_MAP[user?.role?.toLowerCase() || ''] || [];
  const roleLabel = user?.role?.replace(/_/g, ' ') || 'Platforma';

  const handleLogout = async () => {
    await logout();
    toast.success(tr.auth.logged_out);
    router.push('/login');
  };

  return (
    <aside className={cn(
      'h-screen flex flex-col overflow-hidden border-r border-gray-100 bg-white/96 backdrop-blur-xl transition-all duration-300 ease-out dark:border-gray-800 dark:bg-slate-950/95',
      collapsed ? 'w-20' : 'w-72',
      'lg:relative',
      'max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:h-screen',
      mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
    )}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800">
          <Link href="/" className={cn('flex items-center gap-3 transition', collapsed && 'justify-center')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-950">
              B24
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">Buyurtma24</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{roleLabel}</p>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800 lg:inline-flex"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              onClick={onMobileClose}
              className="rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          {navItems.map(({ href, key, icon: Icon, label }) => {
            const labelText = (tr.nav as Record<string, string>)[key] ?? label ?? key;
            const currentView = searchParams.get('view');
            const targetView = href.includes('?view=') ? href.split('?view=')[1] : undefined;
            const isActive = (pathname === href.split('?')[0]
              && (!targetView || currentView === targetView))
              || (pathname.startsWith(href.split('?')[0]) && href === pathname);

            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={cn(
                  isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? labelText : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{labelText}</span>}
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
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
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
            {!collapsed && <span className="text-red-500">{tr.auth.logout}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
