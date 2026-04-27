'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const getPeriodRange = (period: string) => {
  const end = new Date();
  const start = new Date(end);
  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    start.setDate(start.getDate() - 7);
  } else if (period === 'monthly') {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setFullYear(start.getFullYear() - 1);
  }
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
};

export default function ReportsPage() {
  const { tr } = useLang();
  const r = tr.reports;
  const cm = tr.common;
  const PERIODS = Object.entries(r.periods).map(([value, label]) => ({ value, label }));

  const [period, setPeriod] = useState('weekly');
  const range = getPeriodRange(period);

  const { data: sales } = useQuery({ queryKey: ['sales', period], queryFn: () => reportsApi.getSales({ period }).then((r) => r.data.data) });
  const { data: topProducts } = useQuery({ queryKey: ['top-products', period], queryFn: () => reportsApi.getTopProducts({ limit: 10, ...range }).then((r) => r.data.data) });
  const { data: waiters } = useQuery({ queryKey: ['waiters', period], queryFn: () => reportsApi.getWaiterPerformance(range).then((r: any) => r.data.data) });

  const topList: any[] = Array.isArray(topProducts?.data) ? topProducts.data : Array.isArray(topProducts) ? topProducts : [];
  const waiterList: any[] = Array.isArray(waiters?.data) ? waiters.data : Array.isArray(waiters) ? waiters : [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{r.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{r.subtitle}</p>
        </div>
        <button className="btn-secondary"><Download size={16} /> {cm.export}</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button key={p.value} onClick={() => setPeriod(p.value)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p.value ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: r.total_revenue, value: formatCurrency(sales?.totalRevenue ?? 0) },
          { label: r.orders_count, value: sales?.totalOrders ?? 0 },
          { label: r.avg_check, value: formatCurrency(sales?.avgOrderValue ?? 0) },
          { label: r.cancelled, value: sales?.cancelledOrders ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{r.sales_chart}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sales?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{r.orders_chart}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sales?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{r.top_products}</h2>
          <div className="space-y-3">
            {topList.map((prod: any, i: number) => (
              <div key={prod.id ?? i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-sm text-gray-900 dark:text-white truncate">{prod.name}</span>
                    <span className="text-sm font-medium text-gray-500 ml-2">{prod.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${(prod.count / (topList[0]?.count || 1)) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatCurrency(prod.revenue)}</span>
              </div>
            ))}
            {topList.length === 0 && <p className="text-gray-400 text-sm text-center py-4">{r.no_data}</p>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{r.waiter_performance}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3">{r.employee}</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3">{r.order_count}</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3">{r.revenue}</th>
                </tr>
              </thead>
              <tbody>
                {waiterList.map((w: any) => (
                  <tr key={w.id} className="border-t border-gray-50 dark:border-gray-800">
                    <td className="py-2.5 text-sm text-gray-900 dark:text-white">{w.name || `${w.firstName || ''} ${w.lastName || ''}`.trim()}</td>
                    <td className="py-2.5 text-sm text-right text-gray-500">{w.orderCount}</td>
                    <td className="py-2.5 text-sm text-right font-medium text-gray-900 dark:text-white">{formatCurrency(w.revenue)}</td>
                  </tr>
                ))}
                {waiterList.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-400 text-sm">{r.no_data}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
