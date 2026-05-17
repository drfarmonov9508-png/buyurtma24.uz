'use client';

import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { Check, CircleDot, Clock, History, Loader2, Package, ReceiptText, Store } from 'lucide-react';

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
  const { data, isLoading } = useQuery({
    queryKey: ['client-history'],
    queryFn: () => clientApi.getHistory({ limit: 80 }).then((r) => r.data),
  });

  const entries: any[] = (() => {
    const r = data?.data?.data ?? data?.data ?? data;
    return Array.isArray(r) ? r : [];
  })();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <History size={24} /> Ilova tarixi
        </h1>
        <p className="mt-1 text-gray-500">Bu raqam orqali restoran, supermarket va billiarddagi barcha harakatlar</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Loader2 className="animate-spin" size={22} /> Yuklanmoqda...
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Hali tarix yo'q</p>
          <p className="mt-1 text-sm text-gray-400">Ilovadan foydalanganingizda hammasi shu yerda ko‘rinadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry: any) => entry.historyType === 'billiard' ? (
            <BilliardHistoryCard key={`billiard-${entry.id}`} order={entry} />
          ) : (
            <FoodHistoryCard key={`food-${entry.id}`} order={entry} />
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
