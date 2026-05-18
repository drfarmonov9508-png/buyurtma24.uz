'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { Check, CircleDot, Clock, History, Loader2, Package, ReceiptText, Store, ChevronDown } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Kutilmoqda', color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  confirmed: { label: 'Qabul qilindi', color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  preparing: { label: 'Tayyorlanmoqda', color: 'text-orange-700', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ready: { label: 'Tayyor', color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  delivered: { label: 'Yetkazildi', color: 'text-green-700', bg: 'bg-green-50 dark:bg-green-900/20' },
  completed: { label: 'Yakunlandi', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
  cancelled: { label: 'Bekor qilindi', color: 'text-red-700', bg: 'bg-red-50 dark:bg-red-900/20' },
};

function minutesText(order: any) {
  const minutes = Number(order.durationMinutes || 0);
  if (!minutes) return 'Hisoblanmoqda';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} soat ${m} min` : `${m} min`;
}

export default function ClientHistoryPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('day');
  const [typeFilter, setTypeFilter] = useState<'all' | 'billiard' | 'food'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { data, isLoading } = useQuery({
    queryKey: ['client-history'],
    queryFn: () => clientApi.getHistory({ limit: 80 }).then((r) => r.data),
  });

  const entries: any[] = (() => {
    const r = data?.data?.data ?? data?.data ?? data;
    return Array.isArray(r) ? r : [];
  })();

  const filteredEntries = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return entries.filter((entry: any) => {
      const entryDate = new Date(entry.closedAt || entry.confirmedAt || entry.createdAt || '');
      if (from && entryDate < from) return false;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (entryDate > end) return false;
      }
      if (typeFilter !== 'all' && entry.historyType !== typeFilter) return false;
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      return true;
    });
  }, [entries, fromDate, toDate]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredEntries.forEach((entry: any) => {
      const date = new Date(entry.closedAt || entry.confirmedAt || entry.createdAt || '');
      if (!date.getTime()) return;
      let key = '';
      if (groupBy === 'month') key = date.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });
      else if (groupBy === 'year') key = date.getFullYear().toString();
      else key = date.toLocaleDateString('uz-UZ');
      groups[key] = [...(groups[key] || []), entry];
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredEntries, groupBy]);

  const toggleGroup = (key: string) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <History size={24} /> Ilova tarixi
        </h1>
        <p className="mt-1 text-gray-500">Bu raqam orqali restoran, supermarket va billiarddagi barcha harakatlar</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="label">Boshlanish sanasi</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input rounded-2xl" />
          </label>
          <label className="block">
            <span className="label">Tugash sanasi</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input rounded-2xl" />
          </label>
          <label className="block">
            <span className="label">Guruhlash</span>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="input rounded-2xl">
              <option value="day">Kun</option>
              <option value="month">Oy</option>
              <option value="year">Yil</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Tur</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="input rounded-2xl">
              <option value="all">Barchasi</option>
              <option value="billiard">Billiard</option>
              <option value="food">Food</option>
            </select>
          </label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="label">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input rounded-2xl">
              <option value="all">Barchasi</option>
              <option value="pending">Kutilmoqda</option>
              <option value="confirmed">Qabul qilindi</option>
              <option value="completed">Yakunlandi</option>
              <option value="cancelled">Bekor qilingan</option>
            </select>
          </label>
          <button onClick={() => { setFromDate(''); setToDate(''); setTypeFilter('all'); setStatusFilter('all'); }} className="btn-ghost rounded-2xl px-4 py-3">Filtrni tozalash</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Loader2 className="animate-spin" size={22} /> Yuklanmoqda...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Filtrlangan natija bo'yicha yozuvlar topilmadi</p>
          <p className="mt-1 text-sm text-gray-400">Tanlangan sanalar orasida hech qanday tarix yo‘q.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedEntries.map(([group, entries]) => (
            <div key={group} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-slate-950">
              <button type="button" onClick={() => toggleGroup(group)} className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-900">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{group}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{entries.length} ta yozuv</p>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${openGroups[group] ? 'rotate-180' : ''}`} />
              </button>
              {openGroups[group] !== false && (
                <div className="space-y-3 border-t border-gray-100 px-4 py-4 dark:border-slate-800">
                  {entries.map((entry: any) => entry.historyType === 'billiard' ? (
                    <BilliardHistoryCard key={`billiard-${entry.id}`} order={entry} />
                  ) : (
                    <FoodHistoryCard key={`food-${entry.id}`} order={entry} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FoodHistoryCard({ order }: { order: any }) {
  const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className={`flex items-center gap-3 px-4 py-3 ${st.bg}`}>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-gray-900/50">
          <Store size={18} className={st.color} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900 dark:text-white">
            {order.tenant?.name || order.tenantName || "Noma'lum tashkilot"}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {order.table && <span className="text-xs text-gray-500">{order.table.name}</span>}
            <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.total || order.totalAmount || 0)}</p>
          <span className={`mt-1 inline-block rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold ${st.color} dark:bg-black/20`}>
            {st.label}
          </span>
        </div>
      </div>

      {order.items?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5">
          {order.items.map((item: any, i: number) => (
            <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {item.productName || item.name} x {item.quantity}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BilliardHistoryCard({ order }: { order: any }) {
  const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const acceptedItems = (order.items || []).filter((item: any) => item.status === 'accepted');
  const start = order.confirmedAt || order.startAt || order.createdAt;
  const end = order.closedAt || order.endAt;

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-slate-950 to-emerald-800 px-4 py-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
            <CircleDot size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{order.club?.name || order.tenant?.name || 'Billiard'}</p>
            <p className="text-sm text-emerald-100">{order.table?.name || 'Stol'} · {formatDate(order.createdAt)}</p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{st.label}</span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <Info icon={Clock} label="Boshlangan" value={start ? formatTime(start) : '-'} />
          <Info icon={Check} label="Tugagan" value={end ? formatTime(end) : order.status === 'completed' ? '-' : 'Davom etmoqda'} />
          <Info icon={ReceiptText} label="Davomiylik" value={minutesText(order)} />
        </div>

        {acceptedItems.length > 0 && (
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Qo‘shimcha xizmatlar</p>
            <div className="space-y-2">
              {acceptedItems.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.extra?.name || item.name} x {item.quantity}</span>
                  <b>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</b>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          <span className="text-sm font-semibold">Jami to‘lov</span>
          <b>{formatCurrency(Number(order.total || 0))}</b>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
      <Icon size={16} className="text-slate-400" />
      <p className="mt-2 text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
