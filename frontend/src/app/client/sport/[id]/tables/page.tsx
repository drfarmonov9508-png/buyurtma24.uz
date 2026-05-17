"use client";

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { billiardApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Check, Clock, Plus, Send, X } from 'lucide-react';

export default function TablesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const [tables, setTables] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<any>(null);
  const [extraId, setExtraId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const clientLogin = useAuthStore((s) => s.clientLogin);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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

  useEffect(() => {
    const tableId = searchParams.get('tableId');
    if (tableId) setSelectedTableId(tableId);
  }, [searchParams]);

  const activeOrdersByTable = useMemo(() => {
    const map = new Map<string, any>();
    orders
      .filter((o) => o.clubId === id && ['pending', 'confirmed'].includes(o.status))
      .forEach((o) => map.set(o.tableId, o));
    return map;
  }, [orders, id]);

  const activeOrder = orders.find((o) => o.status === 'confirmed');
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const closeOrder = useMutation({
    mutationFn: (orderId: string) => billiardApi.closeOrder(orderId),
    onSuccess: () => {
      toast.success('Sessiya yopildi');
      load();
    },
  });

  const handleBook = async (tableId: string) => {
    if (!user) return toast.error('Avval tizimga kiring');
    try {
      await billiardApi.bookTable(tableId, { startAt: new Date().toISOString(), durationMinutes: 60 });
      toast.success('So‘rov yuborildi. Admin tasdiqlasa timer boshlanadi.');
      setSelectedTableId(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleLoginAndBook = async () => {
    if (!selectedTableId) return toast.error('Stol tanlanmadi');
    if (!phone) return toast.error('Telefon raqamini kiriting');
    try {
      await clientLogin(phone, firstName || undefined, lastName || undefined);
      await billiardApi.bookTable(selectedTableId, { startAt: new Date().toISOString(), durationMinutes: 60 });
      toast.success('So‘rov yuborildi. Admin tasdiqlasa timer boshlanadi.');
      setSelectedTableId(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Tizimga kirishda xato yuz berdi');
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

      {selectedTableId && !isAuthenticated && selectedTable && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-slate-900 shadow-sm dark:border-emerald-600/50 dark:bg-emerald-950/20 dark:text-emerald-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{selectedTable.name} uchun telefon orqali bandlash</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Avval telefon raqamingizni kiritib, keyin so‘rov yuboring.</p>
            </div>
            <span className="badge badge-success">QR orqali</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input className="input rounded-2xl" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="input rounded-2xl" placeholder="Ismingiz" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="input rounded-2xl" placeholder="Familiyangiz" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <button onClick={handleLoginAndBook} className="btn-primary mt-3 rounded-2xl px-4 py-3">Bandlashni davom ettirish</button>
        </div>
      )}

      {activeOrder && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Faol sessiya</p>
              <h3 className="text-xl font-semibold">{activeOrder.table?.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{activeOrder.club?.name || 'Billiard'} · {activeOrder.status === 'confirmed' ? 'Tasdiqlangan' : activeOrder.status}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs uppercase text-slate-500">Boshlanish</p>
                <p className="mt-2 text-lg font-semibold">{new Date(activeOrder.startAt).toLocaleTimeString()}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs uppercase text-slate-500">Narx</p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(Number(activeOrder.pricePerHour || 0))}/soat</p>
              </div>
            </div>
          </div>

          {activeOrder.items?.length > 0 && (
            <div className="mt-4 space-y-2 rounded-3xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Qo‘shimcha buyurtmalar</p>
              {activeOrder.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70">
                  <span>{item.extra?.name || item.name} x {item.quantity}</span>
                  <span className="text-slate-500">{item.status === 'accepted' ? 'Qabul qilingan' : 'Kutilmoqda'}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setActiveTable(activeOrder.table)} className="btn-secondary flex-1 rounded-2xl px-4 py-3"><Plus className="mr-2" /> Qo‘shimcha buyurtma</button>
            <button onClick={() => closeOrder.mutate(activeOrder.id)} className="btn-danger flex-1 rounded-2xl px-4 py-3"><X className="mr-2" /> Sessiyani yopish</button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.filter((table) => !activeOrder || table.status === 'free' || table.id === selectedTableId).map((t) => {
          const order = activeOrdersByTable.get(t.id);
          const ownConfirmed = order?.status === 'confirmed';
          const status = order?.status || t.status;
          const highlighted = t.id === selectedTableId;
          return (
            <div key={t.id} className={`rounded-3xl border p-4 shadow-sm dark:bg-slate-900 ${highlighted ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200 dark:border-slate-800'} bg-white`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <p className="text-sm text-slate-500">{t.type?.name || 'Billiard'} · {formatCurrency(Number(t.pricePerHour))}/soat</p>
                </div>
                <span className={`badge ${status === 'free' ? 'badge-success' : status === 'pending' || status === 'reserved' ? 'badge-warning' : 'badge-danger'}`}>{status === 'free' ? 'Bo‘sh' : status === 'pending' || status === 'reserved' ? 'Kutilmoqda' : 'Band'}</span>
              </div>

              {order?.status === 'pending' && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">Admin tasdig‘i kutilmoqda</div>
              )}

              {ownConfirmed && (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
                  <p><Clock className="mr-1 inline h-4 w-4" /> Faol sessiya</p>
                  <p className="mt-1">{order.durationMinutes || 0} min</p>
                </div>
              )}

              <div className="mt-4 grid gap-2">
                <button
                  onClick={() => ownConfirmed ? setActiveTable(t) : handleBook(t.id)}
                  disabled={status !== 'free' && !ownConfirmed}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    ownConfirmed ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-emerald-600 text-white disabled:bg-slate-200 disabled:text-slate-500'
                  }`}
                >
                  {ownConfirmed ? <><Plus className="mr-2 inline h-4 w-4" /> Qo‘shimcha buyurtma</> : 'Band qilish'}
                </button>
                {t.id === selectedTableId && !isAuthenticated && (
                  <p className="text-xs text-slate-500">Ushbu stol QR orqali tanlandi. Telefon raqamingizni kiritib davom eting.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeTable && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-4 sm:items-center sm:justify-center" onClick={() => setActiveTable(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{activeTable.name}: qo‘shimcha buyurtma</h3>
              <button onClick={() => setActiveTable(null)} className="rounded-2xl bg-slate-100 p-2 dark:bg-slate-800"><X size={16} /></button>
            </div>
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
