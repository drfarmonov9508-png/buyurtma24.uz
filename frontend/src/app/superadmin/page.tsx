'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi, tenantsApi } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Store, ShoppingCart, DollarSign, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: () => reportsApi.getSuperAdminStats().then((r) => r.data),
  });
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: () => tenantsApi.getAll({ page: 1, limit: 10 }).then((r) => r.data),
  });

  const tenantsList: any[] = (() => { const r = tenantsData?.data?.data ?? tenantsData?.data ?? tenantsData; return Array.isArray(r) ? r : []; })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Super Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Barcha cafélar umumiy ko'rsatkichlari</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jami cafélar" value={stats?.tenantCount ?? '—'} icon={Store} color="blue" />
        <StatCard title="Jami buyurtmalar" value={stats?.orderCount ?? '—'} icon={ShoppingCart} color="green" />
        <StatCard title="Jami daromad" value={stats ? formatCurrency(stats.totalRevenue) : '—'} icon={DollarSign} color="orange" />
        <StatCard title="Aktiv foydalanuvchilar" value="—" icon={Users} color="purple" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">So'nggi cafélar</h2>
          <a href="/superadmin/tenants" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Barchasini ko'rish →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="table-header">Café nomi</th>
                <th className="table-header">Slug</th>
                <th className="table-header">Holat</th>
                <th className="table-header">Trial tugashi</th>
                <th className="table-header">Ro'yxatga olingan</th>
              </tr>
            </thead>
            <tbody>
              {tenantsList.map((t: any) => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell font-medium">{t.name}</td>
                  <td className="table-cell text-gray-500">{t.slug}</td>
                  <td className="table-cell">
                    <span className={`badge ${t.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status === 'ACTIVE' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {t.status}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500">{t.trialEndsAt ? formatDate(t.trialEndsAt) : '—'}</td>
                  <td className="table-cell text-gray-500">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
              {!tenantsList.length && (
                <tr><td colSpan={5} className="table-cell text-center text-gray-400 py-8">Hali cafélar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
