"use client";

import { useEffect, useMemo, useState } from 'react';
import { billiardApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Clock, Plus, Send } from 'lucide-react';

export default function TablesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [tables, setTables] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<any>(null);
  const [extraId, setExtraId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const user = useAuthStore((s) => s.user);

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, eRes, oRes] = await Promise.all([
        billiardApi.getTables(id),
        billiardApi.getExtras(id),
        billiardApi.getMyOrders().catch(() => ({ data: { data: [] } })),
      ]);
      setTables(tRes.data.data || tRes.data || []);
      setExtras(eRes.data.data || eRes.data || []);
      setOrders(oRes.data.data || oRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 6000);
    return () => clearInterval(timer);
  }, [id]);

  const activeOrdersByTable = useMemo(() => {
    const map = new Map<string, any>();
    orders
      .filter((o) => o.clubId === id && ['pending', 'confirmed'].includes(o.status))
      .forEach((o) => map.set(o.tableId, o));
    return map;
  }, [orders, id]);

  const handleBook = async (tableId: string) => {
    if (!user) return toast.error('Avval tizimga kiring');
    try {
      await billiardApi.bookTable(tableId, { startAt: new Date().toISOString(), durationMinutes: 60 });
      toast.success('So‘rov yuborildi. Admin tasdiqlasa timer boshlanadi.');
      load();
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const requestExtra = async () => {
    const order = activeOrdersByTable.get(activeTable?.id);
    if (!order || order.status !== 'confirmed') return toast.error('Faol sessiya topilmadi');
    if (!extraId) return toast.error('Mahsulot tanlang');
    try {
      await billiardApi.requestExtra(order.id, { extraId, quantity });
      toast.success('Qo‘shimcha buyurtma adminga yuborildi');
      setActiveTable(null);
      setExtraId('');
      setQuantity(1);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Yuborishda xato');
    }
  };

  if (loading) return <p className="text-slate-400">Yuklanmoqda...</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Stollar</h2>
        <p className="mt-1 text-sm text-slate-500">Bo‘sh stolni tanlang yoki faol sessiyada qo‘shimcha buyurtma yuboring.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => {
          const order = activeOrdersByTable.get(t.id);
          const ownConfirmed = order?.status === 'confirmed';
          const status = order?.status || t.status;
          return (
            <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <p className="text-sm text-slate-500">{t.type?.name || 'Billiard'} · {formatCurrency(Number(t.pricePerHour))}/soat</p>
                </div>
                <span className={`badge ${status === 'free' ? 'badge-success' : status === 'pending' || status === 'reserved' ? 'badge-warning' : 'badge-danger'}`}>
                  {status === 'free' ? 'Bo‘sh' : status === 'pending' || status === 'reserved' ? 'Kutilmoqda' : 'Band'}
                </span>
              </div>

              {order?.status === 'pending' && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">
                  Admin tasdig‘i kutilmoqda
                </div>
              )}

              {ownConfirmed && (
                <div className="mt-4 space-y-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
                  <p><Clock className="mr-1 inline h-4 w-4" /> Sessiya faol</p>
                  {order.items?.length > 0 && (
                    <div className="space-y-1">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between rounded-xl bg-white/70 px-2 py-1 text-xs">
                          <span>{item.extra?.name || item.name} x {item.quantity}</span>
                          <b>{item.status === 'accepted' ? 'Qabul qilindi' : 'Kutilmoqda'}</b>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => ownConfirmed ? setActiveTable(t) : handleBook(t.id)}
                disabled={status !== 'free' && !ownConfirmed}
                className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  ownConfirmed ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-emerald-600 text-white disabled:bg-slate-200 disabled:text-slate-500'
                }`}
              >
                {ownConfirmed ? <><Plus className="mr-2 inline h-4 w-4" /> Qo‘shimcha buyurtma</> : 'Band qilish'}
              </button>
            </div>
          );
        })}
      </div>

      {activeTable && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-4 sm:items-center sm:justify-center" onClick={() => setActiveTable(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{activeTable.name}: qo‘shimcha buyurtma</h3>
            <div className="mt-4 space-y-3">
              <select className="input" value={extraId} onChange={(e) => setExtraId(e.target.value)}>
                <option value="">Mahsulot tanlang</option>
                {extras.map((e) => <option key={e.id} value={e.id}>{e.name} · {formatCurrency(Number(e.price))}</option>)}
              </select>
              <input className="input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value || 1))} />
              <button onClick={requestExtra} className="btn-primary h-12 w-full rounded-2xl">
                <Send size={16} /> Adminga yuborish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
