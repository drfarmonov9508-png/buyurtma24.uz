'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Eye, RefreshCw, X, Loader2, ClipboardList } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const STATUS_KEYS = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

export default function OrdersPage() {
  const { tr } = useLang();
  const o = tr.orders;
  const cm = tr.common;
  const statusLabels = o.status;
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['orders-admin', statusFilter],
    queryFn: () => ordersApi.getAll({ status: statusFilter === 'ALL' ? undefined : statusFilter, limit: 100 }).then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => ordersApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Status yangilandi'); qc.invalidateQueries({ queryKey: ['orders-admin'] }); setSelectedOrder(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  });

  const orderList: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data as any[] : [];

  return (
    <div className="space-y-5 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{o.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? orderList.length} {o.count}</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> {o.refresh}
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_KEYS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === s
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {(statusLabels as any)[s] ?? s}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{o.order_number}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{o.table}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{o.amount}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{cm.status}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{o.time}</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{cm.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-16"><Loader2 size={20} className="animate-spin text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">{cm.loading}</p></td></tr>
              ) : orderList.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-sm text-gray-900">#{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm">{order.table?.name ?? <span className="text-gray-400 italic">{o.takeaway}</span>}</td>
                  <td className="px-4 py-3 font-semibold text-sm text-gray-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                      {(statusLabels as any)[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelectedOrder(order)} className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors ml-auto">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && orderList.length === 0 && (
                <tr><td colSpan={6} className="text-center py-16">
                  <ClipboardList size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{o.empty}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Buyurtma #{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_COLORS[selectedOrder.status]}`}>
                  {(statusLabels as any)[selectedOrder.status] ?? selectedOrder.status}
                </span>
                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><X size={16} /></button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <div className="space-y-0 divide-y divide-gray-50">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.productName || item.product?.name}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(item.price)} × {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {(selectedOrder.notes || selectedOrder.note) && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-700">📝 {selectedOrder.notes || selectedOrder.note}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">{cm.total}</span>
                <span className="font-bold text-xl text-primary-600">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Statusni o'zgartirish:</p>
              <div className="grid grid-cols-3 gap-1.5">
                {['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((s) => (
                  <button key={s} onClick={() => updateMutation.mutate({ id: selectedOrder.id, status: s })}
                    disabled={selectedOrder.status === s || updateMutation.isPending}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedOrder.status === s
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : s === 'CANCELLED'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                    }`}>
                    {updateMutation.isPending ? '...' : (statusLabels as any)[s] ?? s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
