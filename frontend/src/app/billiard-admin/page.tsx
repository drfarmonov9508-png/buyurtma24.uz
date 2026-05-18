'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  AlertTriangle, BarChart3, BellRing, Check, Clock, PackageOpen, Plus,
  ReceiptText, Table2, Timer, WalletCards, X
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { billiardApi, uploadApi } from '@/lib/api';
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
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as 'dashboard' | 'tables' | 'inventory' | 'analytics' | null;
  const [tab, setTab] = useState<'dashboard' | 'tables' | 'inventory' | 'analytics'>(tabParam || 'dashboard');
  const [tableForm, setTableForm] = useState({ name: '', typeId: '', pricePerHour: '', capacity: '4' });
  const [typeForm, setTypeForm] = useState({ name: 'Oddiy', tier: 'oddiy', pricePerHour: '', details: '' });
  const [inventoryForm, setInventoryForm] = useState({ name: '', category: 'Ichimlik', price: '', stockQuantity: '', alertThreshold: '', image: '' });
  const [inventoryUploading, setInventoryUploading] = useState(false);
  const [serviceTable, setServiceTable] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({ extraId: '', quantity: 1 });
  const [stockAdds, setStockAdds] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['billiard-admin-snapshot'],
    queryFn: () => billiardApi.adminSnapshot().then((r) => r.data.data ?? r.data),
    refetchInterval: 7000,
  });

  const analyticsQueryParams = useMemo(() => ({
    period: searchParams?.get('analyticsPeriod') || 'month',
    user: searchParams?.get('analyticsUser') || undefined,
  }), [searchParams]);

  const { data: analyticsData } = useQuery({
    queryKey: ['billiard-analytics', analyticsQueryParams],
    queryFn: () => billiardApi.getAnalytics(analyticsQueryParams).then((r) => r.data.data ?? r.data),
    enabled: tab === 'analytics',
  });

  const club = data?.club;
  const tables: any[] = data?.tables || [];
  const types: any[] = data?.types || [];
  const extras: any[] = data?.extras || [];
  const orders: any[] = data?.orders || [];
  const pendingItems: any[] = data?.pendingItems || [];
  const analytics = analyticsData || {};

  useEffect(() => {
    if (!tabParam) return;
    setTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (!club?.id) return;
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
    const socket = io(`${base}/billiard`, { query: { clubId: club.id }, transports: ['websocket', 'polling'] });
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
      qc.invalidateQueries({ queryKey: ['billiard-analytics'] });
    };
    socket.on('booking-requested', refresh);
    socket.on('booking-confirmed', refresh);
    socket.on('extra-requested', (payload) => {
      refresh();
      toast.error(`${payload?.order?.table?.name || 'Stol'}: qo'shimcha buyurtma so'raldi`, { duration: 6000 });
    });
    socket.on('extra-accepted', refresh);
    socket.on('inventory-updated', refresh);
    socket.on('table-updated', refresh);
    socket.on('order-closed', refresh);
    return () => { socket.disconnect(); };
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

  const createInventory = useMutation({
    mutationFn: () => billiardApi.createExtra({
      ...inventoryForm,
      price: Number(inventoryForm.price),
      stockQuantity: Number(inventoryForm.stockQuantity),
      alertThreshold: Number(inventoryForm.alertThreshold),
    }),
    onSuccess: () => {
      toast.success('Omborga mahsulot qo‘shildi');
      setInventoryForm({ name: '', category: 'Ichimlik', price: '', stockQuantity: '', alertThreshold: '', image: '' });
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const handleInventoryImageUpload = async (file: File) => {
    setInventoryUploading(true);
    try {
      const { data } = await uploadApi.uploadImage(file);
      const imageUrl = data?.data?.original ?? data?.data?.url ?? data?.original ?? data?.url;
      setInventoryForm((prev) => ({ ...prev, image: imageUrl || prev.image }));
    } catch {
      toast.error('Rasm yuklashda xato');
    } finally {
      setInventoryUploading(false);
    }
  };

  const addStock = useMutation({
    mutationFn: ({ id, amount }: any) => billiardApi.updateExtra(id, { addQuantity: Number(amount) }),
    onSuccess: () => {
      toast.success('Ombor soni yangilandi');
      setStockAdds({});
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const openTable = useMutation({
    mutationFn: (id: string) => billiardApi.openTable(id),
    onSuccess: () => {
      toast.success('Stol ochildi, vaqt hisoblanmoqda');
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const confirm = useMutation({
    mutationFn: (id: string) => billiardApi.confirmOrder(id),
    onSuccess: () => {
      toast.success('Mijoz sessiyasi tasdiqlandi');
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => billiardApi.rejectOrder(id),
    onSuccess: () => {
      toast.success('Mijozning band qilish so‘rovi rad etildi');
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Rad etishda xato yuz berdi'),
  });

  const addItem = useMutation({
    mutationFn: ({ orderId, extraId, quantity }: any) => billiardApi.addOrderItem(orderId, { extraId, quantity }),
    onSuccess: () => {
      toast.success('Xizmat stol hisobiga qo‘shildi');
      setServiceTable(null);
      setServiceForm({ extraId: '', quantity: 1 });
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Omborda yetarli emas'),
  });

  const acknowledge = useMutation({
    mutationFn: (id: string) => billiardApi.acknowledgeItem(id),
    onSuccess: () => {
      toast.success('Buyurtma qabul qilindi va hisobga qo‘shildi');
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Omborda yetarli emas'),
  });

  const close = useMutation({
    mutationFn: (id: string) => billiardApi.closeOrder(id),
    onSuccess: (res: any) => {
      const payload = res?.data?.data ?? res?.data;
      setReceipt(payload);
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
      qc.invalidateQueries({ queryKey: ['billiard-analytics'] });
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

  const activeOrders = orders.filter((o) => o.status === 'confirmed');
  const lowStock = extras.filter((e) => Number(e.alertThreshold || 0) > 0 && Number(e.stockQuantity || 0) <= Number(e.alertThreshold || 0));
  const selectedOrder = serviceTable ? ordersByTable.get(serviceTable.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Tashkilot</p>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{club?.name || 'Billiard'}</h1>
          <p className="text-sm text-slate-500">{club?.city} {club?.landmark ? `· ${club.landmark}` : ''}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Metric label="Stol" value={tables.length} />
          <Metric label="Band" value={activeOrders.length} />
          <Metric label="So‘rov" value={pendingItems.length} danger />
          <Metric label="Kam qoldi" value={lowStock.length} warning />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[
          ['dashboard', 'Dashboard', WalletCards],
          ['tables', 'Stollar', Table2],
          ['inventory', 'Ombor', PackageOpen],
          ['analytics', 'Tahlil', BarChart3],
        ].map(([key, label, Icon]: any) => (
          <button key={key} onClick={() => setTab(key)} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${tab === key ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Omborda kam qolgan mahsulotlar</div>
          <p className="mt-1 text-sm">{lowStock.map((i) => `${i.name} (${i.stockQuantity} ta)`).join(', ')}</p>
        </div>
      )}

      {tab === 'dashboard' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => <TableCard key={table.id} table={table} order={ordersByTable.get(table.id)} alerts={pendingByTable.get(table.id) || []} onOpen={() => openTable.mutate(table.id)} onConfirm={confirm.mutate} onReject={reject.mutate} onClose={close.mutate} onService={() => setServiceTable(table)} onAcknowledge={acknowledge.mutate} />)}
        </section>
      )}

      {tab === 'tables' && (
        <section className="grid gap-4 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Tarif qo‘shish</h2>
            <div className="space-y-3">
              <select className="input rounded-2xl" value={typeForm.tier} onChange={(e) => setTypeForm({ ...typeForm, tier: e.target.value, name: tiers.find((t) => t.value === e.target.value)?.label || e.target.value })}>
                {tiers.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input className="input rounded-2xl" placeholder="Soatlik narx" type="number" value={typeForm.pricePerHour} onChange={(e) => setTypeForm({ ...typeForm, pricePerHour: e.target.value })} />
              <input className="input rounded-2xl" placeholder="Tafsilot" value={typeForm.details} onChange={(e) => setTypeForm({ ...typeForm, details: e.target.value })} />
              <button className="btn-primary w-full rounded-2xl" onClick={() => createType.mutate()}><Plus size={16} /> Tarif qo‘shish</button>
            </div>
            <h2 className="mb-3 mt-6 font-semibold">Stol qo‘shish</h2>
            <div className="space-y-3">
              <input className="input rounded-2xl" placeholder="Masalan: 2-stol" value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} />
              <select className="input rounded-2xl" value={tableForm.typeId} onChange={(e) => {
                const type = types.find((t) => t.id === e.target.value);
                setTableForm({ ...tableForm, typeId: e.target.value, pricePerHour: type?.pricePerHour || tableForm.pricePerHour });
              }}>
                <option value="">Tarif tanlang</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name} · {formatCurrency(Number(t.pricePerHour))}</option>)}
              </select>
              <input className="input rounded-2xl" placeholder="Soatlik narx" type="number" value={tableForm.pricePerHour} onChange={(e) => setTableForm({ ...tableForm, pricePerHour: e.target.value })} />
              <button className="btn-primary w-full rounded-2xl" onClick={() => createTable.mutate()}><Plus size={16} /> Stol yaratish</button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {tables.map((t) => (
              <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div><p className="font-semibold">{t.name}</p><p className="text-sm text-slate-500">{t.type?.name || 'Tarifsiz'} · {formatCurrency(Number(t.pricePerHour))}/soat</p></div>
                  <span className={`badge ${t.status === 'free' ? 'badge-success' : t.status === 'reserved' ? 'badge-warning' : 'badge-danger'}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'inventory' && (
        <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Omborga mahsulot qo‘shish</h2>
            <div className="space-y-3">
              <input className="input rounded-2xl" placeholder="Kola 1.5L" value={inventoryForm.name} onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })} />
              <input className="input rounded-2xl" placeholder="Kategoriya" value={inventoryForm.category} onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })} />
              <label className="block">
                <span className="label">Rasm yuklash</span>
                <input type="file" accept="image/*" className="input rounded-2xl py-1.5" onChange={(e) => { if (e.target.files?.[0]) handleInventoryImageUpload(e.target.files[0]); }} />
                {inventoryUploading && <p className="text-xs text-slate-500 mt-2">Rasm yuklanmoqda...</p>}
              </label>
              {inventoryForm.image && (
                <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                  <img src={inventoryForm.image.startsWith('http') ? inventoryForm.image : `http://localhost:3000${inventoryForm.image}`} alt="Preview" className="h-32 w-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <input className="input rounded-2xl" placeholder="Narx" type="number" value={inventoryForm.price} onChange={(e) => setInventoryForm({ ...inventoryForm, price: e.target.value })} />
                <input className="input rounded-2xl" placeholder="Soni" type="number" value={inventoryForm.stockQuantity} onChange={(e) => setInventoryForm({ ...inventoryForm, stockQuantity: e.target.value })} />
                <input className="input rounded-2xl" placeholder="Ogohlantirish" type="number" value={inventoryForm.alertThreshold} onChange={(e) => setInventoryForm({ ...inventoryForm, alertThreshold: e.target.value })} />
              </div>
              <button className="btn-primary w-full rounded-2xl" onClick={() => createInventory.mutate()}><Plus size={16} /> Omborga qo‘shish</button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {extras.map((item) => {
              const low = Number(item.alertThreshold || 0) > 0 && Number(item.stockQuantity || 0) <= Number(item.alertThreshold || 0);
              return (
                <div key={item.id} className={`overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-slate-900 ${low ? 'border-red-300 ring-4 ring-red-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="h-32 bg-slate-100 dark:bg-slate-800">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><PackageOpen /></div>}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="font-semibold">{item.name}</p><p className="text-sm text-slate-500">{item.category || 'Mahsulot'}</p></div>
                      {low && <span className="badge-danger">Kam</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-2xl bg-slate-50 p-2 dark:bg-slate-800"><b>{item.stockQuantity}</b><p className="text-xs text-slate-500">qoldi</p></div>
                      <div className="rounded-2xl bg-slate-50 p-2 dark:bg-slate-800"><b>{item.alertThreshold}</b><p className="text-xs text-slate-500">limit</p></div>
                      <div className="rounded-2xl bg-slate-50 p-2 dark:bg-slate-800"><b>{formatCurrency(Number(item.price))}</b><p className="text-xs text-slate-500">narx</p></div>
                    </div>
                    <div className="flex gap-2">
                      <input className="input h-10 rounded-2xl" type="number" placeholder="Yangi son" value={stockAdds[item.id] || ''} onChange={(e) => setStockAdds({ ...stockAdds, [item.id]: e.target.value })} />
                      <button className="rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950" onClick={() => addStock.mutate({ id: item.id, amount: stockAdds[item.id] || 0 })}>Qo‘shish</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'analytics' && (
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Sessiyalar" value={analytics?.totals?.sessions || 0} />
            <Metric label="Daqiqa" value={analytics?.totals?.minutes || 0} />
            <Metric label="Jami tushum" value={formatCurrency(Number(analytics?.totals?.revenue || 0))} />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Stollar bo‘yicha tushum</h2>
            <div className="space-y-2">
              {(analytics?.byTable || []).map((row: any) => (
                <div key={row.tableId} className="grid grid-cols-4 gap-2 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
                  <b>{row.tableName}</b><span>{row.sessions} sessiya</span><span>{row.minutes} min</span><b className="text-right">{formatCurrency(Number(row.revenue))}</b>
                </div>
              ))}
              {(analytics?.byTable || []).length === 0 && <p className="py-8 text-center text-slate-400">Arxivda yakunlangan sessiyalar hali yo‘q</p>}
            </div>
            <p className="mt-4 text-xs text-slate-400">Arxiv yakunlangan sessiyalarni 5 yilgacha saqlash mantiqi bilan olinadi.</p>
          </div>
        </section>
      )}

      {serviceTable && (
        <Modal onClose={() => setServiceTable(null)} title={`${serviceTable.name}: qo‘shimcha xizmat`}>
          <div className="space-y-3">
            <select className="input rounded-2xl" value={serviceForm.extraId} onChange={(e) => setServiceForm({ ...serviceForm, extraId: e.target.value })}>
              <option value="">Ombordan mahsulot tanlang</option>
              {extras.filter((e) => Number(e.stockQuantity || 0) > 0).map((e) => <option key={e.id} value={e.id}>{e.name} · {e.stockQuantity} ta · {formatCurrency(Number(e.price))}</option>)}
            </select>
            <input className="input rounded-2xl" type="number" min={1} value={serviceForm.quantity} onChange={(e) => setServiceForm({ ...serviceForm, quantity: Number(e.target.value || 1) })} />
            <button className="btn-primary h-12 w-full rounded-2xl" disabled={!selectedOrder} onClick={() => addItem.mutate({ orderId: selectedOrder?.id, extraId: serviceForm.extraId, quantity: serviceForm.quantity })}>Hisobga qo‘shish</button>
          </div>
        </Modal>
      )}

      {receipt && (
        <Modal onClose={() => setReceipt(null)} title="Stol yopildi">
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-sm text-slate-500">Stol va vaqt</p>
              <p className="font-semibold">{receipt.order?.table?.name} · {receipt.order?.durationMinutes} min · {formatCurrency(Number(receipt.order?.pricePerHour || 0))}/soat</p>
            </div>
            <div className="space-y-2">
              {(receipt.items || []).map((item: any) => (
                <div key={item.id} className="flex justify-between rounded-2xl border border-slate-100 p-3 text-sm dark:border-slate-800">
                  <span>{item.name || item.extra?.name} x {item.quantity}</span>
                  <b>{formatCurrency(Number(item.price) * Number(item.quantity))}</b>
                </div>
              ))}
            </div>
            <div className="flex justify-between rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
              <span>Jami</span><span>{formatCurrency(Number(receipt.finalTotal || 0))}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({ label, value, danger, warning }: any) {
  return (
    <div className={`rounded-2xl p-3 text-center shadow-sm ${danger ? 'bg-red-600 text-white' : warning ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100' : 'bg-white text-slate-950 dark:bg-slate-900 dark:text-white'}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className={`text-xs ${danger ? 'text-red-100' : 'text-slate-500'}`}>{label}</p>
    </div>
  );
}

function TableCard({ table, order, alerts, onOpen, onConfirm, onClose, onReject, onService, onAcknowledge }: any) {
  const runningMinutes = order?.status === 'confirmed' ? minutesSince(order.confirmedAt || order.startAt) : 0;
  const runningCost = order?.status === 'confirmed' ? Math.ceil((runningMinutes / 60) * Number(order.pricePerHour || table.pricePerHour)) + Number(order.total || 0) : 0;
  return (
    <article className={`relative overflow-hidden rounded-3xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${alerts.length ? 'border-red-500 ring-4 ring-red-500/15' : 'border-slate-200 dark:border-slate-800'}`}>
      {alerts.length > 0 && <div className="absolute inset-x-0 top-0 bg-red-600 px-4 py-2 text-sm font-semibold text-white"><BellRing className="mr-2 inline h-4 w-4" />{table.name}: {alerts[0].quantity} ta {alerts[0].extra?.name || alerts[0].name} so‘rayapti</div>}
      <div className={alerts.length ? 'pt-10' : ''}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{table.name}</h3>
            <p className="text-sm text-slate-500">{table.type?.name || 'Tarifsiz'} · {formatCurrency(Number(table.pricePerHour))}/soat</p>
            {table.type?.details && <p className="text-xs text-slate-400 mt-1">{table.type.details}</p>}
          </div>
          <span className={`badge ${table.status === 'free' ? 'badge-success' : table.status === 'reserved' ? 'badge-warning' : 'badge-danger'}`}>{table.status === 'free' ? 'Bo‘sh' : table.status === 'reserved' ? 'Kutilmoqda' : 'Band'}</span>
        </div>
        {order ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><Clock size={16} /><p className="mt-1 font-semibold">{order.status === 'confirmed' ? `${runningMinutes} min` : 'Tasdiq kutyapti'}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><ReceiptText size={16} /><p className="mt-1 font-semibold">{formatCurrency(runningCost)}</p></div>
            </div>
            {order.status === 'pending' ? (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-success rounded-2xl" onClick={() => onConfirm(order.id)}><Check size={16} /> Tasdiqlash</button>
                <button className="btn-danger rounded-2xl" onClick={() => onReject(order.id)}><X size={16} /> Rad etish</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-secondary rounded-2xl" onClick={onService}><Plus size={16} /> Xizmat</button>
                <button className="btn-danger rounded-2xl" onClick={() => onClose(order.id)}><Timer size={16} /> Yopish</button>
              </div>
            )}
          </div>
        ) : (
          <button className="mt-4 h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950" onClick={onOpen}>Stolni band qilish</button>
        )}
        {alerts.length > 0 && <div className="mt-3 space-y-2">{alerts.map((item: any) => <div key={item.id} className="flex items-center justify-between rounded-2xl bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200"><span>{item.quantity} x {item.extra?.name || item.name}</span><button onClick={() => onAcknowledge(item.id)} className="rounded-xl bg-red-600 px-3 py-1 font-semibold text-white">Qabul qildim</button></div>)}</div>}
      </div>
    </article>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center sm:justify-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-2xl bg-slate-100 p-2 dark:bg-slate-800"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
