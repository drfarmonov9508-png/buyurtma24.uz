'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AlertTriangle, BarChart3, BellRing, Check, Clock, PackageOpen, Plus,
  Table2, Timer, WalletCards, X, Users, Volume2, VolumeX, Pencil, Trash2, QrCode,
} from 'lucide-react';
import { billiardApi, uploadApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useBilliardSocket } from '@/hooks/useBilliardSocket';
import { useBilliardAlertSound } from '@/hooks/useBilliardAlertSound';
import SessionTimer from '@/components/billiard/SessionTimer';
import BilliardAnalyticsPanel from '@/components/billiard/BilliardAnalyticsPanel';
import BilliardQrModal from '@/components/billiard/BilliardQrModal';
import {
  estimateSessionCost, getSessionStart, statusBadgeClass,
  TABLE_STATUS_LABELS, TIER_LABELS, tierBadgeClass,
} from '@/lib/billiard';

const tiers = [
  { value: 'oddiy', label: 'Oddiy' },
  { value: 'pro', label: 'Pro' },
  { value: 'vip', label: 'Premium/VIP' },
];

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [qrTable, setQrTable] = useState<any>(null);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [editingExtra, setEditingExtra] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('billiard-sound-enabled');
    if (saved !== null) setSoundEnabled(saved === 'true');
  }, []);

  const toggleSound = () => {
    setSoundEnabled((v) => {
      const next = !v;
      localStorage.setItem('billiard-sound-enabled', String(next));
      return next;
    });
  };

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    qc.invalidateQueries({ queryKey: ['billiard-analytics'] });
  }, [qc]);

  const { handleSocketEvent } = useBilliardAlertSound(soundEnabled);

  const { data, isLoading } = useQuery({
    queryKey: ['billiard-admin-snapshot'],
    queryFn: () => billiardApi.adminSnapshot().then((r) => r.data.data ?? r.data),
    refetchInterval: 30000,
  });

  const club = data?.club;

  useBilliardSocket({
    clubId: club?.id,
    enabled: !!club?.id,
    onEvent: (event, payload) => {
      handleSocketEvent(event);
      refresh();
      if (event === 'booking-requested') {
        const tableName = (payload as any)?.table?.name || 'Stol';
        toast(`Yangi band qilish: ${tableName}`, { icon: '🔔', duration: 5000 });
      }
      if (event === 'extra-requested') {
        const tableName = (payload as any)?.table?.name || (payload as any)?.order?.table?.name || 'Stol';
        const itemName = (payload as any)?.item?.name || (payload as any)?.extra?.name || 'Mahsulot';
        toast(`${tableName}: ${itemName} buyurtma`, { icon: '🛒', duration: 6000 });
      }
    },
  });

  const tables: any[] = data?.tables || [];
  const types: any[] = data?.types || [];
  const extras: any[] = data?.extras || [];
  const orders: any[] = data?.orders || [];
  const pendingItems: any[] = data?.pendingItems || [];

  useEffect(() => {
    if (tabParam) setTab(tabParam);
  }, [tabParam]);

  const createType = useMutation({
    mutationFn: () => billiardApi.createType({ ...typeForm, pricePerHour: Number(typeForm.pricePerHour) }),
    onSuccess: () => { toast.success('Tarif qo\'shildi'); setTypeForm({ name: 'Oddiy', tier: 'oddiy', pricePerHour: '', details: '' }); refresh(); },
  });

  const createTable = useMutation({
    mutationFn: () => billiardApi.createTable({ ...tableForm, pricePerHour: Number(tableForm.pricePerHour), capacity: Number(tableForm.capacity) }),
    onSuccess: (res: any) => {
      const created = res?.data?.data ?? res?.data;
      toast.success('Stol qo\'shildi');
      setTableForm({ name: '', typeId: '', pricePerHour: '', capacity: '4' });
      refresh();
      if (created?.qrToken) setQrTable(created);
    },
  });

  const updateTableMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => billiardApi.updateTable(id, data),
    onSuccess: () => { toast.success('Stol yangilandi'); setEditingTable(null); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const deleteTableMut = useMutation({
    mutationFn: (id: string) => billiardApi.deleteTable(id),
    onSuccess: () => { toast.success('Stol o\'chirildi'); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const createInventory = useMutation({
    mutationFn: () => billiardApi.createExtra({ ...inventoryForm, price: Number(inventoryForm.price), stockQuantity: Number(inventoryForm.stockQuantity), alertThreshold: Number(inventoryForm.alertThreshold) }),
    onSuccess: () => { toast.success('Omborga qo\'shildi'); setInventoryForm({ name: '', category: 'Ichimlik', price: '', stockQuantity: '', alertThreshold: '', image: '' }); refresh(); },
  });

  const updateExtraMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => billiardApi.updateExtra(id, data),
    onSuccess: () => { toast.success('Mahsulot yangilandi'); setEditingExtra(null); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const deleteExtraMut = useMutation({
    mutationFn: (id: string) => billiardApi.deleteExtra(id),
    onSuccess: () => { toast.success('Mahsulot o\'chirildi'); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const handleInventoryImageUpload = async (file: File) => {
    setInventoryUploading(true);
    try {
      const { data: res } = await uploadApi.uploadImage(file);
      const imageUrl = res?.data?.original ?? res?.data?.url ?? res?.original ?? res?.url;
      setInventoryForm((prev) => ({ ...prev, image: imageUrl || prev.image }));
    } catch { toast.error('Rasm yuklashda xato'); }
    finally { setInventoryUploading(false); }
  };

  const addStock = useMutation({
    mutationFn: ({ id, amount }: any) => billiardApi.updateExtra(id, { addQuantity: Number(amount) }),
    onSuccess: () => { toast.success('Ombor yangilandi'); setStockAdds({}); refresh(); },
  });

  const openTable = useMutation({ mutationFn: (id: string) => billiardApi.openTable(id), onSuccess: () => { toast.success('Stol ochildi'); refresh(); } });
  const confirm = useMutation({ mutationFn: (id: string) => billiardApi.confirmOrder(id), onSuccess: () => { toast.success('Tasdiqlandi, vaqt boshlandi'); refresh(); } });
  const reject = useMutation({
    mutationFn: (id: string) => billiardApi.rejectOrder(id),
    onSuccess: () => { toast.success('Rad etildi'); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });
  const addItem = useMutation({
    mutationFn: ({ orderId, extraId, quantity }: any) => billiardApi.addOrderItem(orderId, { extraId, quantity }),
    onSuccess: () => { toast.success('Hisobga qo\'shildi'); setServiceTable(null); setServiceForm({ extraId: '', quantity: 1 }); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });
  const acknowledge = useMutation({ mutationFn: (id: string) => billiardApi.acknowledgeItem(id), onSuccess: () => { toast.success('Qabul qilindi'); refresh(); } });
  const close = useMutation({
    mutationFn: (id: string) => billiardApi.closeOrder(id),
    onSuccess: (res: any) => { setReceipt(res?.data?.data ?? res?.data); refresh(); toast.success('Sessiya yopildi'); },
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

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status === 'confirmed');
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const lowStock = extras.filter((e) => Number(e.alertThreshold || 0) > 0 && Number(e.stockQuantity || 0) <= Number(e.alertThreshold || 0));
  const selectedOrder = serviceTable ? ordersByTable.get(serviceTable.id) : null;

  return (
    <div className="space-y-5 pb-8">
      <header className="rounded-[28px] border border-amber-500/15 bg-gradient-to-br from-amber-500/10 via-[#141210] to-[#0c0a09] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{club?.name || 'Klub'}</h1>
            <p className="mt-1 text-sm text-white/40">{club?.city}{club?.landmark ? ` · ${club.landmark}` : ''}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Stollar" value={tables.length} />
            <Metric label="Faol" value={activeOrders.length} accent="emerald" />
            <Metric label="Kutilmoqda" value={pendingOrders.length} accent="amber" />
            <Metric label="Kam ombor" value={lowStock.length} accent={lowStock.length ? 'red' : undefined} />
          </div>
          <button
            onClick={toggleSound}
            className="inline-flex h-11 items-center gap-2 self-start rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 text-sm font-semibold text-amber-300 lg:self-auto"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-1.5">
        {([
          ['dashboard', 'Panel', WalletCards],
          ['tables', 'Stollar', Table2],
          ['inventory', 'Ombor', PackageOpen],
          ['analytics', 'Hisobot', BarChart3],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-[18px] px-4 py-2.5 text-sm font-semibold transition ${
              tab === key
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
                : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      {lowStock.length > 0 && (
        <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Kam qolgan mahsulotlar</div>
          <p className="mt-1 text-sm">{lowStock.map((i) => `${i.name} (${i.stockQuantity})`).join(', ')}</p>
        </div>
      )}

      {tab === 'dashboard' && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <AdminTableCard
              key={table.id}
              table={table}
              order={ordersByTable.get(table.id)}
              alerts={pendingByTable.get(table.id) || []}
              onOpen={() => openTable.mutate(table.id)}
              onConfirm={() => confirm.mutate(ordersByTable.get(table.id)?.id)}
              onReject={() => reject.mutate(ordersByTable.get(table.id)?.id)}
              onClose={() => close.mutate(ordersByTable.get(table.id)?.id)}
              onService={() => setServiceTable(table)}
              onAcknowledge={acknowledge.mutate}
            />
          ))}
        </section>
      )}

      {tab === 'tables' && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="space-y-5 panel-card p-4">
            <div>
              <h2 className="font-semibold text-white">Tarif</h2>
              <div className="mt-3 space-y-2">
                <select className="panel-input" value={typeForm.tier} onChange={(e) => setTypeForm({ ...typeForm, tier: e.target.value, name: tiers.find((t) => t.value === e.target.value)?.label || e.target.value })}>
                  {tiers.map((t) => <option key={t.value} value={t.value} className="bg-[#141210]">{t.label}</option>)}
                </select>
                <input className="panel-input" placeholder="Soatlik narx" type="number" value={typeForm.pricePerHour} onChange={(e) => setTypeForm({ ...typeForm, pricePerHour: e.target.value })} />
                <input className="panel-input" placeholder="Tavsif" value={typeForm.details} onChange={(e) => setTypeForm({ ...typeForm, details: e.target.value })} />
                <button className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 font-semibold text-[#0c0a09]" onClick={() => createType.mutate()}><Plus size={16} /></button>
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-white">Stol</h2>
              <div className="mt-3 space-y-2">
                <input className="panel-input" placeholder="Nomi" value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} />
                <select className="panel-input" value={tableForm.typeId} onChange={(e) => {
                  const type = types.find((t) => t.id === e.target.value);
                  setTableForm({ ...tableForm, typeId: e.target.value, pricePerHour: type?.pricePerHour || tableForm.pricePerHour });
                }}>
                  <option value="" className="bg-[#141210]">Tarif</option>
                  {types.map((t) => <option key={t.id} value={t.id} className="bg-[#141210]">{t.name}</option>)}
                </select>
                <input className="panel-input" placeholder="Narx/soat" type="number" value={tableForm.pricePerHour} onChange={(e) => setTableForm({ ...tableForm, pricePerHour: e.target.value })} />
                <button className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 font-semibold text-[#0c0a09]" onClick={() => createTable.mutate()}><Plus size={16} /></button>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {tables.map((t) => (
              <div key={t.id} className="panel-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-white/45">{t.type?.name} · {formatCurrency(Number(t.pricePerHour))}/soat</p>
                    <p className="mt-1 text-xs text-white/30">{t.capacity} kishi</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(t.status)}`}>
                    {TABLE_STATUS_LABELS[t.status as keyof typeof TABLE_STATUS_LABELS]}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setQrTable(t)}
                    className="flex h-10 items-center justify-center gap-1 rounded-xl bg-amber-500/15 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/25"
                  >
                    <QrCode size={14} /> QR
                  </button>
                  <button
                    onClick={() => setEditingTable(t)}
                    className="flex h-10 items-center justify-center gap-1 rounded-xl bg-white/5 text-xs font-semibold text-white/70 hover:bg-white/10"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`"${t.name}" stolini o'chirasizmi?`)) deleteTableMut.mutate(t.id);
                    }}
                    className="flex h-10 items-center justify-center gap-1 rounded-xl bg-red-500/10 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'inventory' && (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
          <div className="panel-card p-4">
            <h2 className="font-semibold text-white">Mahsulot qo&apos;shish</h2>
            <div className="mt-3 space-y-2">
              <input className="panel-input" placeholder="Nomi" value={inventoryForm.name} onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })} />
              <input className="panel-input" placeholder="Kategoriya" value={inventoryForm.category} onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })} />
              <input type="file" accept="image/*" className="panel-input py-1.5 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-amber-300" onChange={(e) => { if (e.target.files?.[0]) handleInventoryImageUpload(e.target.files[0]); }} />
              {inventoryUploading && <p className="text-xs text-white/40">Yuklanmoqda...</p>}
              {inventoryForm.image && <img src={inventoryForm.image} alt="" className="h-20 w-20 rounded-xl object-cover ring-1 ring-white/10" />}
              <div className="grid grid-cols-3 gap-2">
                <input className="panel-input" placeholder="Narx" type="number" value={inventoryForm.price} onChange={(e) => setInventoryForm({ ...inventoryForm, price: e.target.value })} />
                <input className="panel-input" placeholder="Soni" type="number" value={inventoryForm.stockQuantity} onChange={(e) => setInventoryForm({ ...inventoryForm, stockQuantity: e.target.value })} />
                <input className="panel-input" placeholder="Limit" type="number" value={inventoryForm.alertThreshold} onChange={(e) => setInventoryForm({ ...inventoryForm, alertThreshold: e.target.value })} />
              </div>
              <button className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 font-semibold text-[#0c0a09]" onClick={() => createInventory.mutate()}><Plus size={16} /> Qo&apos;shish</button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {extras.map((item) => {
              const low = Number(item.alertThreshold || 0) > 0 && Number(item.stockQuantity || 0) <= Number(item.alertThreshold || 0);
              return (
                <div key={item.id} className={`panel-card overflow-hidden ${low ? 'ring-2 ring-red-500/30' : ''}`}>
                  <div className="h-28 bg-white/[0.04]">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/25"><PackageOpen /></div>}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-white/45">{item.category}</p>
                      </div>
                      {low && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">Kam</span>}
                    </div>
                    <p className="text-sm text-amber-300/90">{formatCurrency(Number(item.price))} · {item.stockQuantity} ta</p>
                    <div className="flex gap-2">
                      <input className="panel-input h-10 flex-1" type="number" placeholder="+" value={stockAdds[item.id] || ''} onChange={(e) => setStockAdds({ ...stockAdds, [item.id]: e.target.value })} />
                      <button className="rounded-xl bg-amber-500 px-3 text-sm font-semibold text-[#0c0a09]" onClick={() => addStock.mutate({ id: item.id, amount: stockAdds[item.id] || 0 })}>+</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setEditingExtra(item)} className="flex h-9 items-center justify-center gap-1 rounded-xl bg-white/5 text-xs font-semibold text-white/70"><Pencil size={12} /> Tahrir</button>
                      <button
                        onClick={() => { if (confirm(`"${item.name}" ni o'chirasizmi?`)) deleteExtraMut.mutate(item.id); }}
                        className="flex h-9 items-center justify-center gap-1 rounded-xl bg-red-500/10 text-xs font-semibold text-red-400"
                      >
                        <Trash2 size={12} /> O&apos;chirish
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'analytics' && <BilliardAnalyticsPanel />}

      {qrTable && <BilliardQrModal table={qrTable} onClose={() => setQrTable(null)} />}

      {editingTable && (
        <EditTableModal
          table={editingTable}
          types={types}
          onClose={() => setEditingTable(null)}
          onSave={(data) => updateTableMut.mutate({ id: editingTable.id, data })}
          saving={updateTableMut.isPending}
        />
      )}

      {editingExtra && (
        <EditExtraModal
          extra={editingExtra}
          onClose={() => setEditingExtra(null)}
          onSave={(data) => updateExtraMut.mutate({ id: editingExtra.id, data })}
          saving={updateExtraMut.isPending}
        />
      )}

      {serviceTable && (
        <Modal onClose={() => setServiceTable(null)} title={`${serviceTable.name}: xizmat qo'shish`}>
          <select className="input rounded-2xl" value={serviceForm.extraId} onChange={(e) => setServiceForm({ ...serviceForm, extraId: e.target.value })}>
            <option value="">Mahsulot tanlang</option>
            {extras.filter((e) => Number(e.stockQuantity || 0) > 0).map((e) => <option key={e.id} value={e.id}>{e.name} · {e.stockQuantity} ta</option>)}
          </select>
          <input className="input mt-2 rounded-2xl" type="number" min={1} value={serviceForm.quantity} onChange={(e) => setServiceForm({ ...serviceForm, quantity: Number(e.target.value || 1) })} />
          <button className="btn-primary mt-3 h-12 w-full rounded-2xl" disabled={!selectedOrder || !serviceForm.extraId} onClick={() => addItem.mutate({ orderId: selectedOrder?.id, extraId: serviceForm.extraId, quantity: serviceForm.quantity })}>
            Hisobga qo'shish
          </button>
        </Modal>
      )}

      {receipt && (
        <Modal onClose={() => setReceipt(null)} title="Sessiya yopildi">
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-slate-500">{receipt.order?.table?.name}</p>
              <p className="text-lg font-bold">{formatCurrency(Number(receipt.finalTotal || 0))}</p>
              <p className="mt-1 text-xs text-slate-500">{receipt.order?.durationMinutes} daqiqa · Stol: {formatCurrency(Number(receipt.tableTime || 0))} · Xizmat: {formatCurrency(Number(receipt.extrasTotal || 0))}</p>
            </div>
            {(receipt.items || []).map((item: any) => (
              <div key={item.id} className="flex justify-between rounded-2xl border p-3 text-sm dark:border-slate-800">
                <span>{item.name || item.extra?.name} x{item.quantity}</span>
                <b>{formatCurrency(Number(item.price) * Number(item.quantity))}</b>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: 'emerald' | 'amber' | 'red' }) {
  const colors = accent === 'emerald'
    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20'
    : accent === 'amber'
      ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20'
      : accent === 'red'
        ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/20'
        : 'bg-white/[0.04] text-white ring-1 ring-white/[0.06]';
  return (
    <div className={`rounded-2xl p-3 text-center ${colors}`}>
      <p className="text-lg font-bold sm:text-xl">{value}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
    </div>
  );
}

function AdminTableCard({ table, order, alerts, onOpen, onConfirm, onReject, onClose, onService, onAcknowledge }: any) {
  const isConfirmed = order?.status === 'confirmed';
  const isPending = order?.status === 'pending';
  const startAt = isConfirmed ? getSessionStart(order) : undefined;
  const cost = isConfirmed ? estimateSessionCost(order) : null;

  return (
    <article className={`panel-card relative p-4 ${alerts.length ? 'ring-2 ring-red-500/30' : ''}`}>
      {alerts.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-red-600 px-3 py-2 text-xs font-semibold text-white">
          <BellRing size={14} /> {alerts[0].quantity} x {alerts[0].extra?.name || alerts[0].name}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{table.name}</h3>
          <p className="text-sm text-white/45">{table.type?.name || 'Tarifsiz'} · {formatCurrency(Number(table.pricePerHour))}/soat</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierBadgeClass(table.type?.tier)}`}>{TIER_LABELS[table.type?.tier] || table.type?.tier || '—'}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800"><Users size={10} />{table.capacity}</span>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(table.status)}`}>
          {TABLE_STATUS_LABELS[table.status as keyof typeof TABLE_STATUS_LABELS]}
        </span>
      </div>

      {order ? (
        <div className="mt-4 space-y-3">
          {isConfirmed && startAt ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.04] p-3">
                <SessionTimer startAt={startAt} active size="sm" />
              </div>
              <div className="rounded-2xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">Summa</p>
                <p className="mt-1 text-lg font-bold text-amber-300">{formatCurrency(cost?.total || 0)}</p>
                <p className="text-[10px] text-emerald-600">{cost?.minutes} min · xizmat {formatCurrency(cost?.extras || 0)}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Clock size={14} className="inline mr-1" /> Mijoz tasdiqini kutmoqda
              {order.user?.phone && <p className="mt-1 text-xs">{order.user.phone}</p>}
            </div>
          )}

          {isPending ? (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-success h-11 rounded-2xl text-sm" onClick={onConfirm}><Check size={16} /> Tasdiqlash</button>
              <button className="btn-danger h-11 rounded-2xl text-sm" onClick={onReject}><X size={16} /> Rad</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary h-11 rounded-2xl text-sm" onClick={onService}><Plus size={16} /> Xizmat</button>
              <button className="btn-danger h-11 rounded-2xl text-sm" onClick={onClose}><Timer size={16} /> Yopish</button>
            </div>
          )}

          {(order.items || []).length > 0 && (
            <div className="rounded-2xl bg-slate-50 p-2 text-xs dark:bg-slate-900">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className={`flex justify-between py-1 ${item.status === 'pending' ? 'text-amber-600' : ''}`}>
                  <span>{item.name || item.extra?.name} x{item.quantity}{item.status === 'pending' ? ' (kutilmoqda)' : ''}</span>
                  <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button className="mt-4 h-12 w-full rounded-2xl bg-amber-500 text-sm font-semibold text-[#0c0a09]" onClick={onOpen}>
          Stolni ochish (walk-in)
        </button>
      )}

      {alerts.length > 0 && (
        <div className="mt-2 space-y-1">
          {alerts.map((item: any) => (
            <button key={item.id} onClick={() => onAcknowledge(item.id)} className="w-full rounded-xl bg-red-100 py-2 text-xs font-semibold text-red-700">Qabul qildim</button>
          ))}
        </div>
      )}
    </article>
  );
}

function EditTableModal({ table, types, onClose, onSave, saving }: any) {
  const [form, setForm] = useState({
    name: table.name || '',
    typeId: table.typeId || '',
    pricePerHour: String(table.pricePerHour ?? ''),
    capacity: String(table.capacity ?? '4'),
  });

  return (
    <Modal onClose={onClose} title="Stolni tahrirlash">
      <div className="space-y-2">
        <input className="panel-input" placeholder="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="panel-input" value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
          <option value="" className="bg-[#141210]">Tarif</option>
          {types.map((t: any) => <option key={t.id} value={t.id} className="bg-[#141210]">{t.name}</option>)}
        </select>
        <input className="panel-input" placeholder="Narx/soat" type="number" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} />
        <input className="panel-input" placeholder="Sig'im" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <button
          disabled={saving}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-amber-500 font-semibold text-[#0c0a09] disabled:opacity-50"
          onClick={() => onSave({ ...form, pricePerHour: Number(form.pricePerHour), capacity: Number(form.capacity) })}
        >
          Saqlash
        </button>
      </div>
    </Modal>
  );
}

function EditExtraModal({ extra, onClose, onSave, saving }: any) {
  const [form, setForm] = useState({
    name: extra.name || '',
    category: extra.category || '',
    price: String(extra.price ?? ''),
    stockQuantity: String(extra.stockQuantity ?? ''),
    alertThreshold: String(extra.alertThreshold ?? ''),
  });

  return (
    <Modal onClose={onClose} title="Mahsulotni tahrirlash">
      <div className="space-y-2">
        <input className="panel-input" placeholder="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="panel-input" placeholder="Kategoriya" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <input className="panel-input" placeholder="Narx" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className="panel-input" placeholder="Soni" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
          <input className="panel-input" placeholder="Limit" type="number" value={form.alertThreshold} onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })} />
        </div>
        <button
          disabled={saving}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-amber-500 font-semibold text-[#0c0a09] disabled:opacity-50"
          onClick={() => onSave({
            name: form.name,
            category: form.category,
            price: Number(form.price),
            stockQuantity: Number(form.stockQuantity),
            alertThreshold: Number(form.alertThreshold),
          })}
        >
          Saqlash
        </button>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center sm:justify-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/[0.08] bg-[#141210] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-2xl bg-white/5 p-2 text-white/60"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
