'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, ShoppingBag, ReceiptText, XCircle,
  Printer, Star, Clock, Users, ChevronUp, ChevronDown,
} from 'lucide-react';

const PERIODS = [
  { value: 'daily',   label: 'Bugun' },
  { value: 'weekly',  label: 'Hafta' },
  { value: 'monthly', label: 'Oy' },
  { value: 'yearly',  label: 'Yil' },
];

const getPeriodRange = (period: string) => {
  const end = new Date();
  const start = new Date(end);
  if (period === 'daily') start.setHours(0, 0, 0, 0);
  else if (period === 'weekly') start.setDate(start.getDate() - 7);
  else if (period === 'monthly') start.setMonth(start.getMonth() - 1);
  else start.setFullYear(start.getFullYear() - 1);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
};

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
  } catch { return iso; }
};

const HOUR_LABELS = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
  '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];

export default function ReportsPage() {
  const [period, setPeriod] = useState('weekly');
  const range = getPeriodRange(period);

  const { data: salesRaw, isLoading: salesLoading } = useQuery({
    queryKey: ['adm-sales', period],
    queryFn: () => reportsApi.getSales({ period, ...range }).then(r => r.data?.data ?? r.data),
  });
  const { data: topRaw } = useQuery({
    queryKey: ['adm-top', period],
    queryFn: () => reportsApi.getTopProducts({ limit: 10, ...range }).then(r => r.data?.data ?? r.data),
  });
  const { data: waitersRaw } = useQuery({
    queryKey: ['adm-waiters', period],
    queryFn: () => reportsApi.getWaiterPerformance(range).then((r: any) => r.data?.data ?? r.data),
  });
  const { data: peakRaw } = useQuery({
    queryKey: ['adm-peak'],
    queryFn: () => reportsApi.getPeakHours().then(r => r.data?.data ?? r.data),
  });
  const { data: cancelRaw } = useQuery({
    queryKey: ['adm-cancel'],
    queryFn: () => reportsApi.getCancellations().then(r => r.data?.data ?? r.data),
  });

  const sales = salesRaw ?? {};
  const topList: any[] = Array.isArray(topRaw) ? topRaw : [];
  const waiterList: any[] = Array.isArray(waitersRaw) ? waitersRaw : [];
  const chartData = (sales.daily || []).map((d: any) => ({
    ...d, date: fmtDate(d.date),
  }));
  const peakList: any[] = Array.isArray(peakRaw) ? peakRaw : [];
  const peakData = HOUR_LABELS.map((h, i) => {
    const found = peakList.find(p => Number(p.hour) === i);
    return { soat: `${h}:00`, buyurtma: Number(found?.orderCount || 0) };
  });
  const cancelData = cancelRaw ?? {};
  const cancelRate = Number(cancelData.rate || 0);
  const growth = sales.ordersGrowth ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hisobotlar</h1>
          <p className="text-gray-500 text-sm mt-0.5">Savdo va tahlil ma&apos;lumotlari</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <Printer size={15} /> Chop etish
        </button>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              period === p.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Jami daromad',
            value: formatCurrency(sales.totalRevenue ?? 0),
            icon: TrendingUp,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
            sub: growth !== 0
              ? <span className={`flex items-center gap-0.5 text-xs font-semibold ${growth > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {growth > 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}{Math.abs(growth)}% o&apos;tgan oyga nisbatan
                </span>
              : null,
          },
          {
            label: 'Buyurtmalar soni',
            value: sales.totalOrders ?? 0,
            icon: ShoppingBag,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
          },
          {
            label: "O'rtacha chek",
            value: formatCurrency(sales.avgOrderValue ?? 0),
            icon: ReceiptText,
            color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
          },
          {
            label: 'Bekor qilingan',
            value: sales.cancelledOrders ?? 0,
            icon: XCircle,
            color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
            sub: cancelRate > 0
              ? <span className="text-xs text-red-500 font-medium">{cancelRate}% bekor qilish darajasi</span>
              : null,
          },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={16} />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {sub && <div className="mt-1">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> Savdo dinamikasi (so&apos;m)
          </h2>
          {salesLoading ? (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Yuklanmoqda...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v)} />
                <Tooltip formatter={(v: any) => [formatCurrency(v), 'Daromad']} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-emerald-500" /> Buyurtmalar soni
          </h2>
          {salesLoading ? (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Yuklanmoqda...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [v, 'Buyurtmalar']} />
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products + Waiter performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-500" /> Top mahsulotlar
          </h2>
          <div className="space-y-3">
            {topList.map((prod: any, i: number) => (
              <div key={prod.id ?? i} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-900 dark:text-white truncate font-medium">{prod.name}</span>
                    <span className="text-xs font-semibold text-gray-500 ml-2 flex-shrink-0">{prod.count} dona</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.round((Number(prod.count) / (Number(topList[0]?.count) || 1)) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">{formatCurrency(prod.revenue)}</span>
              </div>
            ))}
            {topList.length === 0 && <p className="text-gray-400 text-sm text-center py-6">Ma&apos;lumot yo&apos;q</p>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-violet-500" /> Ofitsiantlar samaradorligi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2">Xodim</th>
                  <th className="text-right text-xs font-semibold text-gray-400 pb-2">Buyurtmalar</th>
                  <th className="text-right text-xs font-semibold text-gray-400 pb-2">Daromad</th>
                </tr>
              </thead>
              <tbody>
                {waiterList.map((w: any, i: number) => (
                  <tr key={w.id ?? i} className="border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {(w.name || w.firstName || '?')[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">{w.name || `${w.firstName || ''} ${w.lastName || ''}`.trim()}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-sm text-right text-gray-600 dark:text-gray-400 font-medium">{w.orderCount}</td>
                    <td className="py-2.5 text-sm text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(w.revenue)}</td>
                  </tr>
                ))}
                {waiterList.length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-400 text-sm">Ma&apos;lumot yo&apos;q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Peak hours */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Clock size={16} className="text-orange-500" /> Eng band soatlar
        </h2>
        <p className="text-xs text-gray-400 mb-4">Kun davomida buyurtmalar taqsimoti</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={peakData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="soat" tick={{ fontSize: 9 }} interval={1} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip formatter={(v: any) => [v, 'Buyurtmalar']} labelFormatter={l => `${l} soat`} />
            <Bar dataKey="buyurtma" fill="#f97316" radius={[3, 3, 0, 0]}
              label={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cancellations summary */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <XCircle size={16} className="text-red-500" /> Bekor qilingan buyurtmalar hisoboti
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Jami buyurtmalar', value: cancelData.total ?? '—' },
            { label: 'Bekor qilingan', value: cancelData.cancelled ?? '—' },
            { label: 'Bekor qilish darajasi', value: cancelRate > 0 ? `${cancelRate}%` : '0%' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {cancelRate > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Muvaffaqiyatli</span>
              <span>Bekor qilingan</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
              <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${100 - cancelRate}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
