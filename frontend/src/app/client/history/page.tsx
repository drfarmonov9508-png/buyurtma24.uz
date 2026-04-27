'use client';

import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { History, Store, Package, Clock, Check, ChefHat, Loader2, UtensilsCrossed } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Kutilmoqda',     color: 'text-amber-700',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  confirmed: { label: 'Qabul qilindi',  color: 'text-blue-700',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  preparing: { label: 'Tayyorlanmoqda', color: 'text-orange-700',  bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ready:     { label: 'Tayyor',          color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  delivered: { label: 'Yetkazildi',     color: 'text-green-700',   bg: 'bg-green-50 dark:bg-green-900/20' },
  completed: { label: 'Yakunlandi',     color: 'text-gray-600',    bg: 'bg-gray-50 dark:bg-gray-800' },
  cancelled: { label: 'Bekor qilindi',  color: 'text-red-700',     bg: 'bg-red-50 dark:bg-red-900/20' },
};

export default function ClientHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['client-history'],
    queryFn: () => clientApi.getHistory({ limit: 50 }).then((r) => r.data),
  });

  const orders: any[] = (() => {
    const r = data?.data ?? data;
    return Array.isArray(r) ? r : [];
  })();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <History size={24} /> Buyurtma tarixi
        </h1>
        <p className="text-gray-500 mt-1">Barcha tashkilotlardagi buyurtmalaringiz</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg font-medium">Hali buyurtma yo'q</p>
          <p className="text-gray-400 text-sm mt-1">Tashkilotlardan buyurtma berganingizda bu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
            return (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all">
                <div className={`px-4 py-3 flex items-center gap-3 ${st.bg}`}>
                  <div className="w-10 h-10 rounded-xl bg-white/70 dark:bg-gray-900/50 flex items-center justify-center flex-shrink-0">
                    <Store size={18} className={st.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {order.tenant?.name || order.tenantName || 'Noma\'lum tashkilot'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {order.table && (
                        <span className="text-xs text-gray-500">🪑 {order.table.name}</span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(order.total || order.totalAmount || 0)}
                    </p>
                    <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${st.color} bg-white/60 dark:bg-black/20`}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
                    {order.items.map((item: any, i: number) => (
                      <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                        {item.productName || item.name} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
