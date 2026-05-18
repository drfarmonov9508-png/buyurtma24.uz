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
  Table2, ClipboardList, Star, Percent, X, PackageOpen
} from 'lucide-react';

type NavKey = 'dashboard' | 'categories' | 'products' | 'tables' | 'orders' | 'staff' | 'inventory' | 'discounts' | 'reports' | 'settings' | 'cafes' | 'subscriptions' | 'users';

const SUPERADMIN_NAV: { href: string; key: NavKey; icon: any }[] = [
  { href: '/superadmin', key: 'dashboard', icon: LayoutDashboard },
  { href: '/superadmin/tenants', key: 'cafes', icon: Store },
  { href: '/superadmin/subscriptions', key: 'subscriptions', icon: Star },
  { href: '/superadmin/users', key: 'users', icon: Users },
];

const ADMIN_NAV: { href: string; key: NavKey; icon: any }[] = [
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

const BILLIARD_NAV: { href: string; key: NavKey; icon: any }[] = [
  { href: '/billiard-admin?tab=dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/billiard-admin?tab=tables', key: 'tables', icon: Table2 },
  { href: '/billiard-admin?tab=inventory', key: 'inventory', icon: PackageOpen },
  { href: '/billiard-admin?tab=analytics', key: 'reports', icon: BarChart2 },
];

const CASHIER_NAV: { href: string; key: NavKey; icon: any }[] = [
  { href: '/cashier', key: 'dashboard', icon: LayoutDashboard },
  { href: '/cashier/orders', key: 'orders', icon: ClipboardList },
];

const WAITER_NAV: { href: string; key: NavKey; icon: any }[] = [
  { href: '/waiter', key: 'tables', icon: Table2 },
  { href: '/waiter/orders', key: 'orders', icon: ClipboardList },
];

const KITCHEN_NAV: { href: string; key: NavKey; icon: any }[] = [
  { href: '/kitchen', key: 'orders', icon: ClipboardList },
];

const NAV_MAP: Record<string, typeof ADMIN_NAV> = {
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

  const handleLogout = async () => {
    await logout();
    toast.success(tr.auth.logged_out);
    router.push('/login');
  };

  return (
    <aside className={cn(
      'h-screen flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur border-r border-gray-100 dark:border-gray-800 transition-all duration-300 z-50',
      collapsed ? 'w-16' : 'w-64',
      'max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:w-72 max-lg:shadow-2xl',
      mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-800">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-950 dark:bg-white rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-[11px] font-black text-white dark:text-slate-950">B24</span>
            </div>
            <span className="font-extrabold text-gray-950 dark:text-white">Buyurtma24</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 ml-auto max-lg:hidden"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button
          onClick={onMobileClose}
          className="hidden max-lg:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map(({ href, key, icon: Icon }) => {
          const label = tr.nav[key] ?? key;
          const [baseHref, query] = href.split('?');
          const isActive = query && searchParams
            ? pathname === baseHref && new URLSearchParams(query).toString().split('&').every((entry) => {
                const [k, v] = entry.split('=');
                return searchParams.get(k) === v;
              })
            : pathname === href || (href !== '/admin' && href !== '/superadmin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
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
            <p className="text-xs text-gray-400 truncate">{user.role}</p>
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
          {!collapsed && <span className="text-red-500">{tr.auth.logout}</span>}
        </button>
      </div>
    </aside>
  );
}
