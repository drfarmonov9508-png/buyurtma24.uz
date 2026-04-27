'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import { formatCurrency, ORDER_STATUS_COLORS, formatTime } from '@/lib/utils';
import { ShoppingCart, DollarSign, TrendingUp, Clock, Package, ArrowUpRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLang } from '@/lib/i18n';

export default function AdminDashboard() {
  const { tr } = useLang();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.getDashboard().then((r) => r.data.data),
    refetchInterval: 30000,
  });
  const { data: sales } = useQuery({
    queryKey: ['sales-week'],
    queryFn: () => reportsApi.getSales({ period: 'weekly' }).then((r) => r.data.data),
  });

  const d = tr.dashboard;
  const statusLabels = tr.orders.status;

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{d.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{d.subtitle}</p>
        </div>
        {isLoading && <Loader2 size={18} className="animate-spin text-gray-400" />}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={d.today_orders} value={stats?.todayOrders ?? 0} icon={ShoppingCart} color="blue" change={`+${stats?.ordersGrowth ?? 0}% ${d.yesterday}`} changeType="up" />
        <StatCard title={d.today_revenue} value={stats ? formatCurrency(stats.todayRevenue) : '—'} icon={DollarSign} color="green" change={`+${stats?.revenueGrowth ?? 0}% ${d.yesterday}`} changeType="up" />
        <StatCard title={d.active_orders} value={stats?.activeOrders ?? 0} icon={Clock} color="orange" />
        <StatCard title={d.monthly_revenue} value={stats ? formatCurrency(stats.monthRevenue) : '—'} icon={TrendingUp} color="purple" />
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-sm">{d.weekly_sales}</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Haftalik</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sales?.daily || []} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v: number) => formatCurrency(v)} />
              <Tooltip
                formatter={(v: any) => [formatCurrency(v), 'Daromad']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                cursor={{ fill: 'rgba(99,102,241,0.05)' }}
              />
              <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-sm">{d.recent_orders}</h2>
            <ArrowUpRight size={14} className="text-gray-400" />
          </div>
          <div className="space-y-1">
            {stats?.recentOrders?.slice(0, 6).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">#{o.orderNumber}</p>
                  <p className="text-[11px] text-gray-400">{o.table?.name ?? tr.orders.takeaway} · {formatTime(o.createdAt)}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[o.status]}`}>{(statusLabels as any)[o.status] ?? o.status}</span>
              </div>
            ))}
            {!stats?.recentOrders?.length && <p className="text-gray-400 text-sm text-center py-8">{d.no_orders}</p>}
          </div>
        </div>
      </div>

      {/* Top Products + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-sm mb-4">{d.top_products}</h2>
          <div className="space-y-3">
            {stats?.topProducts?.slice(0, 5).map((p: any, i: number) => {
              const colors = ['bg-gradient-to-r from-amber-400 to-amber-500', 'bg-gradient-to-r from-gray-300 to-gray-400', 'bg-gradient-to-r from-orange-300 to-orange-400', 'bg-primary-100', 'bg-primary-50'];
              const textColors = [i < 3 ? 'text-white' : 'text-primary-700'];
              return (
                <div key={p.id ?? i} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg ${colors[i] || 'bg-gray-100'} ${textColors[0]} text-xs flex items-center justify-center font-bold shadow-sm`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                      <div className="bg-gradient-to-r from-primary-500 to-primary-400 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((p.count / (stats?.topProducts?.[0]?.count || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 font-semibold tabular-nums">{p.count}x</span>
                </div>
              );
            })}
            {!stats?.topProducts?.length && <p className="text-gray-400 text-sm text-center py-6">{d.no_data}</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-sm mb-4">{d.low_stock}</h2>
          <div className="space-y-2">
            {stats?.lowStock?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Package size={14} className="text-orange-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                </div>
                <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-1 rounded-lg">{item.quantity} {item.unit}</span>
              </div>
            ))}
            {!stats?.lowStock?.length && <p className="text-gray-400 text-sm text-center py-6">{d.all_sufficient}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
