'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { billiardApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Minus, Plus, ShoppingBag } from 'lucide-react';

type Props = {
  clubId: string;
  session: any;
  onOrdered: () => void;
};

export default function ClientExtrasPanel({ clubId, session, onOrdered }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: extras = [] } = useQuery({
    queryKey: ['billiard-extras', clubId],
    queryFn: () => billiardApi.getExtras(clubId).then((r) => r.data?.data ?? r.data ?? []),
    enabled: !!clubId && session?.status === 'confirmed',
  });

  const orderMutation = useMutation({
    mutationFn: ({ extraId, quantity }: { extraId: string; quantity: number }) =>
      billiardApi.requestOrderItem(session.id, { extraId, quantity }),
    onSuccess: () => {
      toast.success('Buyurtma yuborildi. Admin tasdiqlashini kuting.');
      setQuantities({});
      onOrdered();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  });

  if (session?.status !== 'confirmed') return null;

  const available = (extras as any[]).filter((e) => Number(e.stockQuantity || 0) > 0);
  const pendingItems = (session.items || []).filter((i: any) => i.status === 'pending');
  const acceptedItems = (session.items || []).filter((i: any) => i.status === 'accepted' || !i.status);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2">
        <ShoppingBag size={18} className="text-emerald-600" />
        <h3 className="font-semibold">Qo'shimcha xizmatlar</h3>
      </div>

      {pendingItems.length > 0 && (
        <div className="mt-3 space-y-2">
          {pendingItems.map((item: any) => (
            <div key={item.id} className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              {item.name || item.extra?.name} x{item.quantity} — admin tasdiqlayapti
            </div>
          ))}
        </div>
      )}

      {acceptedItems.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {acceptedItems.map((item: any) => (
            <span key={item.id} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40">
              {item.name || item.extra?.name} x{item.quantity}
            </span>
          ))}
        </div>
      )}

      {available.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Hozircha mavjud mahsulot yo'q</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {available.map((extra) => {
            const qty = quantities[extra.id] || 1;
            return (
              <div key={extra.id} className="rounded-[24px] border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex gap-3">
                  {extra.image ? (
                    <img src={extra.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <ShoppingBag size={20} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{extra.name}</p>
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(Number(extra.price))}</p>
                    <p className="text-xs text-slate-400">{extra.stockQuantity} ta qoldi</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, [extra.id]: Math.max(1, qty - 1) })}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, [extra.id]: Math.min(Number(extra.stockQuantity), qty + 1) })}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => orderMutation.mutate({ extraId: extra.id, quantity: qty })}
                    disabled={orderMutation.isPending}
                    className="ml-auto h-9 flex-1 rounded-xl bg-slate-950 text-xs font-semibold text-white dark:bg-white dark:text-slate-950"
                  >
                    Buyurtma
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
