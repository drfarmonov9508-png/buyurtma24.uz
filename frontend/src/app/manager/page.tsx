'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { productsApi, tablesApi, usersApi } from '@/lib/api';
import { Package, Grid3X3, Users, Tag, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ManagerDashboard() {
  const { user } = useAuthStore();

  const { data: products } = useQuery({
    queryKey: ['manager-products'],
    queryFn: () => productsApi.getAll({ limit: 1 }).then((r) => r.data),
  });
  const { data: tables } = useQuery({
    queryKey: ['manager-tables'],
    queryFn: () => tablesApi.getAll().then((r) => r.data),
  });
  const { data: staff } = useQuery({
    queryKey: ['manager-staff'],
    queryFn: () => usersApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const productCount = products?.data?.total ?? products?.total ?? 0;
  const tableList: any[] = (() => { const r = tables?.data ?? tables; return Array.isArray(r) ? r : []; })();
  const staffList: any[] = (() => { const r = staff?.data?.data ?? staff?.data ?? staff; return Array.isArray(r) ? r : []; })();

  const stats = [
    { label: 'Mahsulotlar', value: productCount, icon: Package, href: '/manager/products', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'Stollar', value: tableList.length, icon: Grid3X3, href: '/manager/tables', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Xodimlar', value: staffList.length, icon: Users, href: '/manager/staff', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Band stollar', value: tableList.filter((t) => t.status === 'occupied').length, icon: TrendingUp, href: '/manager/tables', color: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Salom, {user?.firstName}!
        </h1>
        <p className="text-gray-500 mt-1">Ish yurituvchi paneli</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/manager/products" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Package size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Mahsulot qo'shish</h3>
          </div>
          <p className="text-sm text-gray-400">Narx belgilash, stop-list, kategoriya</p>
        </Link>
        <Link href="/manager/tables" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Grid3X3 size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Stol holati</h3>
          </div>
          <p className="text-sm text-gray-400">Band / bo'sh holatga o'tkazish</p>
        </Link>
      </div>
    </div>
  );
}
