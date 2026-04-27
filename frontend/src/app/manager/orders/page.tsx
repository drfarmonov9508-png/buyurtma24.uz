'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ClipboardList, RefreshCw, Clock, Check, ChefHat, PackageCheck,
  X, Loader2, ChevronDown, ChevronUp, UtensilsCrossed, RotateCcw
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:   { label: 'Kutilmoqda',     color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-400' },
  confirmed: { label: 'Qabul qilindi',  color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500' },
  preparing: { label: 'Tayyorlanmoqda', color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  ready:     { label: 'Tayyor',          color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',dot: 'bg-emerald-500' },
  delivered: { label: 'Yetkazildi',     color: 'text-green-700',   bg: 'bg-green-50 border-green-200',   dot: 'bg-green-500' },
  completed: { label: 'Yakunlandi',     color: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200',     dot: 'bg-gray-400' },
  cancelled: { label: 'Bekor qilindi',  color: 'text-red-700',     bg: 'bg-red-50 border-red-200',       dot: 'bg-red-500' },
};

const NEXT_ACTIONS: Record<string, { label: string; status: string; color: string }[]> = {
  pending:   [{ label: '✅ Qabul qilish',    status: 'confirmed', color: 'bg-blue-500 hover:bg-blue-600' },
              { label: '❌ Bekor qilish',     status: 'cancelled', color: 'bg-red-500 hover:bg-red-600' }],
  confirmed: [{ label: '👨‍🍳 Tayyorlanmoqda', status: 'preparing', color: 'bg-orange-500 hover:bg-orange-600' },
              { label: '❌ Bekor qilish',     status: 'cancelled', color: 'bg-red-500 hover:bg-red-600' }],
  preparing: [{ label: '✅ Tayyor',           status: 'ready',     color: 'bg-emerald-500 hover:bg-emerald-600' }],
  ready:     [{ label: '🚀 Yetkazildi',      status: 'delivered', color: 'bg-green-500 hover:bg-green-600' }],
  delivered: [{ label: '✔ Yakunlash',        status: 'completed', color: 'bg-gray-500 hover:bg-gray-600' }],
};

const FILTER_TABS = [
  { key: 'active',    label: 'Faol', statuses: ['pending', 'confirmed', 'preparing', 'ready'] },
  { key: 'pending',   label: 'Kutilmoqda', statuses: ['pending'] },
  { key: 'all',       label: 'Barchasi', statuses: [] },
  { key: 'completed', label: 'Yakunlangan', statuses: ['completed', 'delivered'] },
];

export default function ManagerOrdersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('active');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['manager-orders', filter],
    queryFn: () => {
      const tab = FILTER_TABS.find(t => t.key === filter)!;
      if (tab.statuses.length === 1) {
        return ordersApi.getAll({ status: tab.statuses[0], limit: 100 }).then(r => r.data);
      }
      return ordersApi.getAll({ limit: 100 }).then(r => r.data);
    },
    refetchInterval: 8000,
  });

  const orders: any[] = (() => {
    const raw = data?.data?.data ?? data?.data ?? data;
    const list = Array.isArray(raw) ? raw : [];
    const tab = FILTER_TABS.find(t => t.key === filter)!;
    if (tab.statuses.length === 0) return list;
    return list.filter((o: any) => tab.statuses.includes(o.status));
  })();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Holat yangilandi');
      qc.invalidateQueries({ queryKey: ['manager-orders'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => ordersApi.updateStatus(id, 'cancelled'),
    onSuccess: () => {
      toast.success('Buyurtma bekor qilindi (qaytarildi)');
      qc.invalidateQueries({ queryKey: ['manager-orders'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const pendingCount = orders.filter((o: any) => o.status === 'pending').length;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList size={24} /> Buyurtmalar
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Klientlardan kelgan barcha buyurtmalar</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Yangilash
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Kutilmoqda', count: orders.filter(o => o.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
          { label: 'Jarayonda', count: orders.filter(o => ['confirmed','preparing'].includes(o.status)).length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: ChefHat },
          { label: 'Tayyor', count: orders.filter(o => o.status === 'ready').length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: PackageCheck },
          { label: 'Jami (bugun)', count: orders.length, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', icon: ClipboardList },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
              <Icon size={20} className={s.color} />
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {FILTER_TABS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === t.key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {t.label}
            {t.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" /> Yuklanmoqda...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <ClipboardList size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">Buyurtma topilmadi</p>
          <p className="text-gray-400 text-sm mt-1">Yangi buyurtmalar bu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const actions = NEXT_ACTIONS[order.status] || [];
            const isExpanded = expanded === order.id;
            const isMutating = statusMutation.isPending;

            return (
              <div key={order.id} className={`bg-white dark:bg-gray-900 rounded-2xl border-2 ${st.bg} overflow-hidden transition-all`}>
                {/* Order header */}
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${st.dot} ${order.status === 'pending' ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 dark:text-white">#{order.orderNumber}</p>
                      {order.table && (
                        <span className="text-xs bg-white/80 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full font-medium text-gray-600 dark:text-gray-300">
                          🪑 {order.table.name}
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${st.bg} ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
                      {order.client && <span> · 👤 {order.client.firstName || order.client.phone}</span>}
                      <span> · {order.items?.length || 0} ta mahsulot</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                    <button onClick={() => setExpanded(isExpanded ? null : order.id)}
                      className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded: items + actions */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                    {/* Items */}
                    <div className="space-y-1.5">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                              <UtensilsCrossed size={11} className="text-violet-500" />
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">{item.productName}</span>
                            <span className="text-gray-400 text-xs">×{item.quantity}</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800 font-semibold text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Jami</span>
                      <span className="text-violet-600 font-bold">{formatCurrency(order.total)}</span>
                    </div>

                    {/* Note */}
                    {order.note && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                        📝 {order.note}
                      </div>
                    )}

                    {/* Action buttons */}
                    {actions.length > 0 && (
                      <div className="flex gap-2 pt-1 flex-wrap">
                        {actions.map(action => (
                          <button key={action.status}
                            onClick={() => statusMutation.mutate({ id: order.id, status: action.status })}
                            disabled={isMutating}
                            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-white font-semibold text-sm ${action.color} transition-colors disabled:opacity-50 shadow-sm`}>
                            {isMutating ? <Loader2 size={14} className="animate-spin mx-auto" /> : action.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Refund button for completed */}
                    {order.status === 'delivered' || order.status === 'completed' ? (
                      <button
                        onClick={() => { if (confirm('Bu buyurtmani qaytarmoqchimisiz?')) refundMutation.mutate(order.id); }}
                        disabled={refundMutation.isPending}
                        className="w-full py-2 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                        <RotateCcw size={14} /> Qaytarish
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Quick accept for pending (collapsed) */}
                {!isExpanded && order.status === 'pending' && (
                  <div className="px-4 pb-3 flex gap-2">
                    <button onClick={() => statusMutation.mutate({ id: order.id, status: 'confirmed' })}
                      disabled={isMutating}
                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                      <Check size={13} /> Qabul qilish
                    </button>
                    <button onClick={() => statusMutation.mutate({ id: order.id, status: 'cancelled' })}
                      disabled={isMutating}
                      className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                      <X size={13} />
                    </button>
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
