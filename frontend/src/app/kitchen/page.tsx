'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, RefreshCw, ChefHat, Loader2, UtensilsCrossed, Bell, Flame, PackageCheck } from 'lucide-react';

const STATUS_NEXT: Record<string, string> = { CONFIRMED: 'PREPARING', PREPARING: 'READY' };

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return 'Hozirgina';
  if (diff < 60) return `${diff} daq.`;
  return `${Math.floor(diff / 60)} soat ${diff % 60} daq.`;
}

export default function KitchenPage() {
  const qc = useQueryClient();
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: () => ordersApi.getKitchen().then((r: any) => r.data),
    refetchInterval: 8000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kitchen-orders'] }); toast.success('Status yangilandi'); },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) => ordersApi.updateItemStatus(itemId, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kitchen-orders'] }); },
    onError: () => toast.error('Xatolik'),
  });

  const raw = data?.data?.data ?? data?.data ?? data;
  const orders: any[] = Array.isArray(raw) ? raw : [];
  const pending = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PENDING');
  const preparing = orders.filter((o) => o.status === 'PREPARING');
  const ready = orders.filter((o) => o.status === 'READY');

  const columns = [
    { key: 'pending', label: 'Yangi buyurtmalar', items: pending, color: 'amber', icon: Bell, btnLabel: 'Tayyorlashni boshlash', btnColor: 'from-amber-500 to-orange-500 shadow-amber-300/50' },
    { key: 'preparing', label: 'Tayyorlanmoqda', items: preparing, color: 'blue', icon: Flame, btnLabel: 'Tayyor', btnColor: 'from-blue-500 to-cyan-500 shadow-blue-300/50' },
    { key: 'ready', label: 'Tayyor', items: ready, color: 'emerald', icon: PackageCheck, btnLabel: '', btnColor: '' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ChefHat size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Oshxona Displeyi</h1>
            <p className="text-xs text-gray-500">{orders.length} ta faol buyurtma</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
              <Bell size={12} /> {pending.length} yangi
            </span>
            <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
              <Flame size={12} /> {preparing.length} tayyorlanmoqda
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
              <PackageCheck size={12} /> {ready.length} tayyor
            </span>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm transition-colors border border-gray-700">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Yangilash
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-24">
          <Loader2 size={32} className="animate-spin text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Buyurtmalar yuklanmoqda...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <UtensilsCrossed size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Hozircha buyurtma yo'q</p>
          <p className="text-gray-600 text-sm mt-1">Yangi buyurtmalar avtomatik ko'rinadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 min-h-[calc(100vh-64px)]">
          {columns.map((col) => {
            const ColIcon = col.icon;
            return (
              <div key={col.key} className={`border-r border-gray-800 last:border-r-0 flex flex-col`}>
                {/* Column Header */}
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 sticky top-[64px] z-[5]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full bg-${col.color}-400 ${col.key === 'preparing' ? 'animate-pulse' : ''}`} />
                    <span className={`font-bold text-sm text-${col.color}-400`}>{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold bg-${col.color}-500/10 text-${col.color}-400 px-2 py-0.5 rounded-full`}>
                    {col.items.length}
                  </span>
                </div>
                {/* Column Items */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {col.items.length === 0 && (
                    <div className="text-center py-12">
                      <ColIcon size={24} className="text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-600 text-xs">Hozircha yo'q</p>
                    </div>
                  )}
                  {col.items.map((order: any) => {
                    const mins = Math.floor((now - new Date(order.createdAt).getTime()) / 60000);
                    const isUrgent = mins > 15 && col.key !== 'ready';
                    return (
                      <div key={order.id} className={`rounded-xl border ${isUrgent ? 'border-red-500/50 bg-red-950/30' : 'border-gray-800 bg-gray-900'} overflow-hidden`}>
                        {/* Order Header */}
                        <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-800/50">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">#{order.orderNumber}</span>
                            {order.table && (
                              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">Stol {order.table.name}</span>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 text-xs ${isUrgent ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                            <Clock size={11} />
                            {timeAgo(order.createdAt)}
                            {isUrgent && <span className="ml-1">🔥</span>}
                          </div>
                        </div>
                        {/* Items */}
                        <div className="px-3 py-2 space-y-1.5">
                          {order.items?.map((item: any) => {
                            const isDone = item.status === 'READY';
                            const isPrep = item.status === 'PREPARING';
                            return (
                              <div key={item.id} className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const next = item.status === 'PENDING' ? 'PREPARING' : item.status === 'PREPARING' ? 'READY' : null;
                                    if (next) updateItemMutation.mutate({ itemId: item.id, status: next });
                                  }}
                                  className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                    isDone ? 'border-emerald-500 bg-emerald-500 text-white' : isPrep ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600 hover:border-gray-400'
                                  }`}
                                >
                                  {isDone && <CheckCircle2 size={10} />}
                                </button>
                                <span className={`text-sm flex-1 ${isDone ? 'text-gray-500 line-through' : isPrep ? 'text-blue-300' : 'text-gray-200'}`}>
                                  {item.productName || item.product?.name}
                                </span>
                                <span className={`text-sm font-bold ${isDone ? 'text-gray-600' : 'text-white'}`}>×{item.quantity}</span>
                              </div>
                            );
                          })}
                        </div>
                        {/* Note */}
                        {(order.note || order.notes) && (
                          <div className="px-3 pb-2">
                            <p className="text-xs bg-amber-500/10 text-amber-400 rounded-lg px-2.5 py-1.5">📝 {order.note || order.notes}</p>
                          </div>
                        )}
                        {/* Action */}
                        {STATUS_NEXT[order.status] && (
                          <div className="px-3 pb-3 pt-1">
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: STATUS_NEXT[order.status] })}
                              disabled={updateStatusMutation.isPending}
                              className={`w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${col.btnColor} shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5`}
                            >
                              {updateStatusMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ColIcon size={14} />}
                              {col.btnLabel}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
