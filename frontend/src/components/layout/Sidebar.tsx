'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Store, Users, BarChart2,
  Settings, LogOut, ChevronLeft, ChevronRight, Tag, Package,
  UtensilsCrossed, Table2, ClipboardList, Star, Percent
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
  { href: '/admin/products', key: 'products', icon: UtensilsCrossed },
  { href: '/admin/tables', key: 'tables', icon: Table2 },
  { href: '/admin/orders', key: 'orders', icon: ClipboardList },
  { href: '/admin/staff', key: 'staff', icon: Users },
  { href: '/admin/inventory', key: 'inventory', icon: Package },
  { href: '/admin/discounts', key: 'discounts', icon: Percent },
  { href: '/admin/reports', key: 'reports', icon: BarChart2 },
  { href: '/admin/settings', key: 'settings', icon: Settings },
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
};

export default function Sidebar() {
  const pathname = usePathname();
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
      'h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-800">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600">Buyurtma24</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 ml-auto"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map(({ href, key, icon: Icon }) => {
          const label = tr.nav[key] ?? key;
          const isActive = pathname === href || (href !== '/admin' && href !== '/superadmin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
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
