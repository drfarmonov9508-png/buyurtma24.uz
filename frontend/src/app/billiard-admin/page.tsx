'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { BellRing, Check, Clock, Plus, ReceiptText, Timer, X } from 'lucide-react';
import { billiardApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const tiers = [
  { value: 'oddiy', label: 'Oddiy' },
  { value: 'pro', label: 'Pro' },
  { value: 'vip', label: 'Premium/VIP' },
];

function minutesSince(date?: string) {
  if (!date) return 0;
  return Math.max(1, Math.ceil((Date.now() - new Date(date).getTime()) / 60000));
}

export default function BilliardAdminPage() {
  const qc = useQueryClient();
  const [tableForm, setTableForm] = useState({ name: '', typeId: '', pricePerHour: '', capacity: '4' });
  const [typeForm, setTypeForm] = useState({ name: 'Oddiy', tier: 'oddiy', pricePerHour: '', details: '' });
  const [extraForm, setExtraForm] = useState({ name: '', category: 'Ichimlik', price: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['billiard-admin-snapshot'],
    queryFn: () => billiardApi.adminSnapshot().then((r) => r.data.data ?? r.data),
    refetchInterval: 7000,
  });

  const club = data?.club;
  const tables: any[] = data?.tables || [];
  const types: any[] = data?.types || [];
  const extras: any[] = data?.extras || [];
  const orders: any[] = data?.orders || [];
  const pendingItems: any[] = data?.pendingItems || [];

  useEffect(() => {
    if (!club?.id) return;
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
    const socket = io(`${base}/billiard`, { query: { clubId: club.id }, transports: ['websocket', 'polling'] });
    const refresh = () => qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    socket.on('booking-requested', refresh);
    socket.on('booking-confirmed', refresh);
    socket.on('extra-requested', (payload) => {
      refresh();
      toast.error(`${payload?.order?.table?.name || 'Stol'}: qo'shimcha buyurtma so'raldi`, { duration: 6000 });
    });
    socket.on('extra-accepted', refresh);
    socket.on('table-updated', refresh);
    socket.on('order-closed', refresh);
    return () => {
      socket.disconnect();
    };
  }, [club?.id, qc]);

  const createType = useMutation({
    mutationFn: () => billiardApi.createType({ ...typeForm, pricePerHour: Number(typeForm.pricePerHour) }),
    onSuccess: () => {
      toast.success('Tarif qo‘shildi');
      setTypeForm({ name: 'Oddiy', tier: 'oddiy', pricePerHour: '', details: '' });
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const createTable = useMutation({
    mutationFn: () => billiardApi.createTable({ ...tableForm, pricePerHour: Number(tableForm.pricePerHour), capacity: Number(tableForm.capacity) }),
    onSuccess: () => {
      toast.success('Stol qo‘shildi');
      setTableForm({ name: '', typeId: '', pricePerHour: '', capacity: '4' });
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const createExtra = useMutation({
    mutationFn: () => billiardApi.createExtra({ ...extraForm, price: Number(extraForm.price) }),
    onSuccess: () => {
      toast.success('Qo‘shimcha xizmat qo‘shildi');
      setExtraForm({ name: '', category: 'Ichimlik', price: '' });
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const confirm = useMutation({
    mutationFn: (id: string) => billiardApi.confirmOrder(id),
    onSuccess: () => {
      toast.success('Sessiya boshlandi');
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const close = useMutation({
    mutationFn: (id: string) => billiardApi.closeOrder(id),
    onSuccess: (res: any) => {
      const total = res?.data?.data?.finalTotal ?? res?.data?.finalTotal;
      toast.success(`Sessiya yopildi: ${formatCurrency(Number(total || 0))}`);
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const acknowledge = useMutation({
    mutationFn: (id: string) => billiardApi.acknowledgeItem(id),
    onSuccess: () => {
      toast.success('Buyurtma qabul qilindi');
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const ordersByTable = useMemo(() => {
    const map = new Map<string, any>();
    orders.forEach((order) => map.set(order.tableId, order));
    return map;
  }, [orders]);

  const pendingByTable = useMemo(() => {
    const map = new Map<string, any[]>();
    pendingItems.forEach((item) => {
      const tableId = item.order?.tableId;
      if (!tableId) return;
      map.set(tableId, [...(map.get(tableId) || []), item]);
    });
    return map;
  }, [pendingItems]);

  if (isLoading) return <div className="py-12 text-center text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Tashkilot</p>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{club?.name || 'Billiard'}</h1>
          <p className="text-sm text-slate-500">{club?.city} {club?.landmark ? `· ${club.landmark}` : ''}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900"><p className="text-xl font-bold">{tables.length}</p><p className="text-xs text-slate-500">Stol</p></div>
          <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900"><p className="text-xl font-bold">{orders.filter((o) => o.status === 'confirmed').length}</p><p className="text-xs text-slate-500">Band</p></div>
          <div className="rounded-2xl bg-red-600 p-3 text-white shadow-sm"><p className="text-xl font-bold">{pendingItems.length}</p><p className="text-xs text-red-100">So‘rov</p></div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Tarif qo‘shish</h2>
          <div className="space-y-3">
            <select className="input" value={typeForm.tier} onChange={(e) => setTypeForm({ ...typeForm, tier: e.target.value, name: tiers.find((t) => t.value === e.target.value)?.label || e.target.value })}>
              {tiers.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input className="input" placeholder="Soatlik narx" type="number" value={typeForm.pricePerHour} onChange={(e) => setTypeForm({ ...typeForm, pricePerHour: e.target.value })} />
            <input className="input" placeholder="Tafsilot" value={typeForm.details} onChange={(e) => setTypeForm({ ...typeForm, details: e.target.value })} />
            <button className="btn-primary w-full" onClick={() => createType.mutate()}><Plus size={16} /> Qo‘shish</button>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Stol qo‘shish</h2>
          <div className="space-y-3">
            <input className="input" placeholder="Masalan: 2-stol" value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} />
            <select className="input" value={tableForm.typeId} onChange={(e) => {
              const type = types.find((t) => t.id === e.target.value);
              setTableForm({ ...tableForm, typeId: e.target.value, pricePerHour: type?.pricePerHour || tableForm.pricePerHour });
            }}>
              <option value="">Tarif tanlang</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name} · {formatCurrency(Number(t.pricePerHour))}</option>)}
            </select>
            <input className="input" placeholder="Soatlik narx" type="number" value={tableForm.pricePerHour} onChange={(e) => setTableForm({ ...tableForm, pricePerHour: e.target.value })} />
            <button className="btn-primary w-full" onClick={() => createTable.mutate()}><Plus size={16} /> Stol yaratish</button>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Qo‘shimcha xizmat</h2>
          <div className="space-y-3">
            <input className="input" placeholder="Kola 1.5L" value={extraForm.name} onChange={(e) => setExtraForm({ ...extraForm, name: e.target.value })} />
            <input className="input" placeholder="Kategoriya" value={extraForm.category} onChange={(e) => setExtraForm({ ...extraForm, category: e.target.value })} />
            <input className="input" placeholder="Narx" type="number" value={extraForm.price} onChange={(e) => setExtraForm({ ...extraForm, price: e.target.value })} />
            <button className="btn-primary w-full" onClick={() => createExtra.mutate()}><Plus size={16} /> Saqlash</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => {
          const order = ordersByTable.get(table.id);
          const alerts = pendingByTable.get(table.id) || [];
          const runningMinutes = order?.status === 'confirmed' ? minutesSince(order.confirmedAt || order.startAt) : 0;
          const runningCost = order?.status === 'confirmed' ? Math.ceil((runningMinutes / 60) * Number(order.pricePerHour || table.pricePerHour)) + Number(order.total || 0) : 0;

          return (
            <article key={table.id} className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${alerts.length ? 'border-red-500 ring-4 ring-red-500/15' : 'border-slate-200 dark:border-slate-800'}`}>
              {alerts.length > 0 && (
                <div className="absolute inset-x-0 top-0 bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                  <BellRing className="mr-2 inline h-4 w-4" />
                  {table.name}: {alerts[0].quantity} ta {alerts[0].extra?.name || alerts[0].name} so‘rayapti
                </div>
              )}
              <div className={alerts.length ? 'pt-10' : ''}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{table.name}</h3>
                    <p className="text-sm text-slate-500">{table.type?.name || 'Tarifsiz'} · {formatCurrency(Number(table.pricePerHour))}/soat</p>
                  </div>
                  <span className={`badge ${table.status === 'free' ? 'badge-success' : table.status === 'reserved' ? 'badge-warning' : 'badge-danger'}`}>
                    {table.status === 'free' ? 'Bo‘sh' : table.status === 'reserved' ? 'Kutilmoqda' : 'Band'}
                  </span>
                </div>

                {order ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><Clock size={16} /><p className="mt-1 font-semibold">{order.status === 'confirmed' ? `${runningMinutes} min` : 'Tasdiq kutyapti'}</p></div>
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><ReceiptText size={16} /><p className="mt-1 font-semibold">{formatCurrency(runningCost)}</p></div>
                    </div>
                    {order.status === 'pending' ? (
                      <button className="btn-success w-full" onClick={() => confirm.mutate(order.id)}><Check size={16} /> Tasdiqlash</button>
                    ) : (
                      <button className="btn-danger w-full" onClick={() => close.mutate(order.id)}><Timer size={16} /> Stolni yopish</button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Hozircha sessiya yo‘q</div>
                )}

                {alerts.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {alerts.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">
                        <span>{item.quantity} x {item.extra?.name || item.name}</span>
                        <button onClick={() => acknowledge.mutate(item.id)} className="rounded-lg bg-red-600 px-3 py-1 font-semibold text-white">Qabul qildim</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
