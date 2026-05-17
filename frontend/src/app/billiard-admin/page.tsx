'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  AlertTriangle, BarChart3, BellRing, CalendarDays, Check, CheckCircle2, Clock, Copy,
  Edit3, ImagePlus, PackageOpen, Plus, ReceiptText, Table2, Timer, Trash2,
  WalletCards, X
} from 'lucide-react';
import { billiardApi, uploadApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import QRCode from 'qrcode.react';

const tiers = [
  { value: 'oddiy', label: 'Oddiy' },
  { value: 'pro', label: 'Pro' },
  { value: 'vip', label: 'Premium/VIP' },
];

function minutesSince(date?: string) {
  if (!date) return 0;
  return Math.max(1, Math.ceil((Date.now() - new Date(date).getTime()) / 60000));
}

function playAlertTone() {
  try {
    const ctx = new window.AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 620;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    setTimeout(() => ctx.close(), 200);
  } catch {
    // ignore autoplay restrictions
  }
}

type NotificationEntry = {
  id: string;
  type: 'booking' | 'extra' | 'stock' | 'info';
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
};

export default function BilliardAdminPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get('view') as 'dashboard' | 'tables' | 'inventory' | 'analytics') || 'dashboard';
  const [tab, setTab] = useState<'dashboard' | 'tables' | 'inventory' | 'analytics'>(defaultTab);
  const [tableForm, setTableForm] = useState({ name: '', typeId: '', pricePerHour: '', capacity: '4' });
  const [typeForm, setTypeForm] = useState({ name: 'Oddiy', tier: 'oddiy', pricePerHour: '', details: '' });
  const [inventoryForm, setInventoryForm] = useState<{ name: string; category: string; price: string; stockQuantity: string; alertThreshold: string; image: string }>({ name: '', category: 'Ichimlik', price: '', stockQuantity: '', alertThreshold: '', image: '' });
  const [inventoryImageFile, setInventoryImageFile] = useState<File | null>(null);
  const [editExtra, setEditExtra] = useState<any>(null);
  const [serviceTable, setServiceTable] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({ extraId: '', quantity: 1 });
  const [stockAdds, setStockAdds] = useState<Record<string, string>>({});
  const [qrTable, setQrTable] = useState<any>(null);
  const [analyticsFilter, setAnalyticsFilter] = useState({ year: new Date().getFullYear(), month: '', userId: '' });
  const [receipt, setReceipt] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['billiard-admin-snapshot'],
    queryFn: () => billiardApi.adminSnapshot().then((r) => r.data.data ?? r.data),
    refetchInterval: 7000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['billiard-analytics'],
    queryFn: () => billiardApi.getAnalytics().then((r) => r.data.data ?? r.data),
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
    const current = (searchParams.get('view') as 'dashboard' | 'tables' | 'inventory' | 'analytics') || 'dashboard';
    if (current !== tab) setTab(current);
  }, [searchParams, tab]);

  const changeTab = (value: 'dashboard' | 'tables' | 'inventory' | 'analytics') => {
    router.replace(`/billiard-admin?view=${value}`);
    setTab(value);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audioElement = new Audio('/notification.wav');
      audioElement.preload = 'auto';
      setAudio(audioElement);
    }
  }, []);

  const addNotification = (notification: Omit<NotificationEntry, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((current) => [{
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
      createdAt: Date.now(),
      read: false,
      ...notification,
    }, ...current].slice(0, 12));
  };

  const playNotificationSound = () => {
    if (audio) {
      audio.currentTime = 0;
      void audio.play().catch(() => playAlertTone());
    } else {
      playAlertTone();
    }
  };

  useEffect(() => {
    if (!club?.id) return;
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
    const socket = io(`${base}/billiard`, { query: { clubId: club.id }, transports: ['websocket', 'polling'] });
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
      qc.invalidateQueries({ queryKey: ['billiard-analytics'] });
    };
    socket.on('booking-requested', (payload) => {
      refresh();
      playNotificationSound();
      addNotification({
        type: 'booking',
        title: 'Yangi bandlash so‘rovi',
        message: `${payload?.table?.name || payload?.order?.table?.name || 'Stol'} bandlash so‘rovi keldi`,
      });
      toast.error(`${payload?.table?.name || payload?.order?.table?.name || 'Stol'}: yangi bandlash so'rovi`, { duration: 6000 });
    });
    socket.on('booking-confirmed', (payload) => {
      refresh();
      playNotificationSound();
      addNotification({
        type: 'booking',
        title: 'Bandlash tasdiqlandi',
        message: `${payload?.table?.name || 'Stol'} bandlash qabul qilindi`,
      });
      toast.success(`${payload?.table?.name || 'Stol'}: bandlash tasdiqlandi`);
    });
    socket.on('extra-requested', (payload) => {
      refresh();
      playNotificationSound();
      addNotification({
        type: 'extra',
        title: 'Qo‘shimcha buyurtma',
        message: `${payload?.order?.table?.name || 'Stol'} uchun qo'shimcha buyurtma so'raldi`,
      });
      toast.error(`${payload?.order?.table?.name || 'Stol'}: qo'shimcha buyurtma so'raldi`, { duration: 6000 });
    });
    socket.on('extra-accepted', refresh);
    socket.on('extra-cancelled', refresh);
    socket.on('booking-cancelled', refresh);
    socket.on('inventory-updated', refresh);
    socket.on('table-updated', refresh);
    socket.on('order-closed', refresh);
    return () => { socket.disconnect(); };
  }, [club?.id, qc, audio]);

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
    mutationFn: async () => {
      let imageUrl = inventoryForm.image;
      if (inventoryImageFile) {
        const upload = await uploadApi.uploadImage(inventoryImageFile);
        imageUrl = upload.data.data?.url || upload.data.url || imageUrl || '';
      }
      return billiardApi.createExtra({
        ...inventoryForm,
        image: imageUrl,
        price: Number(inventoryForm.price),
        stockQuantity: Number(inventoryForm.stockQuantity),
        alertThreshold: Number(inventoryForm.alertThreshold),
      });
    },
    onSuccess: () => {
      toast.success('Omborga mahsulot qo‘shildi');
      setInventoryForm({ name: '', category: 'Ichimlik', price: '', stockQuantity: '', alertThreshold: '', image: '' });
      setInventoryImageFile(null);
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const updateExtra = useMutation({
    mutationFn: async ({ id, payload }: any) => {
      let imageUrl = payload.image;
      if (inventoryImageFile) {
        const upload = await uploadApi.uploadImage(inventoryImageFile);
        imageUrl = upload.data.data?.url || upload.data.url || imageUrl || '';
      }
      return billiardApi.updateExtra(id, { ...payload, image: imageUrl });
    },
    onSuccess: () => {
      toast.success('Mahsulot yangilandi');
      setEditExtra(null);
      setInventoryImageFile(null);
      setInventoryForm({ name: '', category: 'Ichimlik', price: '', stockQuantity: '', alertThreshold: '', image: '' });
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const deleteExtra = useMutation({
    mutationFn: (id: string) => billiardApi.deleteExtra(id),
    onSuccess: () => {
      toast.success('Mahsulot o‘chirildi');
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const addStock = useMutation({
    mutationFn: ({ id, amount }: any) => billiardApi.updateExtra(id, { addQuantity: Number(amount) }),
    onSuccess: () => {
      toast.success('Ombor soni yangilandi');
      setStockAdds({});
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const cancelOrder = useMutation({
    mutationFn: (id: string) => billiardApi.cancelOrder(id),
    onSuccess: () => {
      toast.success('Bandlash bekor qilindi');
      qc.invalidateQueries({ queryKey: ['billiard-admin-snapshot'] });
    },
  });

  const cancelItem = useMutation({
    mutationFn: (id: string) => billiardApi.cancelItem(id),
    onSuccess: () => {
      toast.success('Qo‘shimcha buyurtma bekor qilindi');
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
  const notificationCount = pendingItems.length + lowStock.length;
  const unreadCount = notifications.filter((item) => !item.read).length;
  const selectedOrder = serviceTable ? ordersByTable.get(serviceTable.id) : null;

  const archiveOrders = analytics?.archive || [];
  const analyticsUsers = useMemo(() => {
    const map = new Map<string, any>();
    archiveOrders.forEach((order: any) => {
      const key = order.userId || 'unknown';
      const label = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.phone : 'Mijoz';
      if (!map.has(key)) {
        map.set(key, { userId: key, label, sessions: 0, minutes: 0, revenue: 0 });
      }
      const current = map.get(key);
      current.sessions += 1;
      current.minutes += Number(order.durationMinutes || 0);
      current.revenue += Number(order.total || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [archiveOrders]);

  const filteredArchive = useMemo(() => {
    return archiveOrders.filter((order: any) => {
      const closedAt = new Date(order.closedAt || order.confirmedAt || order.startAt || order.createdAt || '');
      if (analyticsFilter.year && closedAt.getFullYear() !== Number(analyticsFilter.year)) return false;
      if (analyticsFilter.month && closedAt.getMonth() + 1 !== Number(analyticsFilter.month)) return false;
      if (analyticsFilter.userId && order.userId !== analyticsFilter.userId) return false;
      return true;
    });
  }, [archiveOrders, analyticsFilter]);

  const analyticsTotalsFiltered = useMemo(() => ({
    sessions: filteredArchive.length,
    minutes: filteredArchive.reduce((sum: number, order: any) => sum + Number(order.durationMinutes || 0), 0),
    revenue: filteredArchive.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
  }), [filteredArchive]);

  const analyticsByTable = useMemo(() => {
    const map = new Map<string, any>();
    filteredArchive.forEach((order: any) => {
      const key = order.tableId;
      const current = map.get(key) || { tableId: key, tableName: order.table?.name || 'Stol', sessions: 0, minutes: 0, revenue: 0 };
      current.sessions += 1;
      current.minutes += Number(order.durationMinutes || 0);
      current.revenue += Number(order.total || 0);
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredArchive]);

  const analyticsByUser = useMemo(() => {
    const map = new Map<string, any>();
    filteredArchive.forEach((order: any) => {
      const key = order.userId || 'unknown';
      const current = map.get(key) || {
        userId: key,
        userName: order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.phone : 'Mijoz',
        sessions: 0,
        minutes: 0,
        revenue: 0,
      };
      current.sessions += 1;
      current.minutes += Number(order.durationMinutes || 0);
      current.revenue += Number(order.total || 0);
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredArchive]);

  const openNotificationCenter = () => {
    setShowNotificationCenter(true);
    setNotifications((current) => current.map((item) => item.read ? item : { ...item, read: true }));
  };

  const clearNotifications = () => setNotifications([]);

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

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {[
            ['dashboard', 'Dashboard', WalletCards],
            ['tables', 'Stollar', Table2],
            ['inventory', 'Ombor', PackageOpen],
            ['analytics', 'Tahlil', BarChart3],
          ].map(([key, label, Icon]: any) => (
            <button key={key} onClick={() => changeTab(key)} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${tab === key ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Icon size={16} /> {label}
              {key === 'dashboard' && notificationCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">{notificationCount}</span>
              )}
            </button>
          ))}
        </div>
        <button onClick={openNotificationCenter} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
          <BellRing size={16} /> Bildirishnomalar
          {unreadCount > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">{unreadCount}</span>}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[
          ['dashboard', 'Dashboard', WalletCards],
          ['tables', 'Stollar', Table2],
          ['inventory', 'Ombor', PackageOpen],
          ['analytics', 'Tahlil', BarChart3],
        ].map(([key, label, Icon]: any) => (
          <button key={key} onClick={() => changeTab(key)} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${tab === key ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <Icon size={16} /> {label}
            {key === 'dashboard' && notificationCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">{notificationCount}</span>
            )}
          </button>
        ))}
      </div>
      {(pendingItems.length > 0 || lowStock.length > 0) && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Urgent notifications</p>
              <p className="text-sm text-red-700 dark:text-red-200">{pendingItems.length} yangi so‘rov va {lowStock.length} kam ombor holati mavjud.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/70 dark:text-red-100">
              <BellRing size={16} /> {notificationCount} ta ogohlantirish
            </div>
          </div>
        </div>
      )}

      {showNotificationCenter && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setShowNotificationCenter(false)}
          onClear={clearNotifications}
        />
      )}

      {lowStock.length > 0 && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Omborda kam qolgan mahsulotlar</div>
          <p className="mt-1 text-sm">{lowStock.map((i) => `${i.name} (${i.stockQuantity} ta)`).join(', ')}</p>
        </div>
      )}

      {tab === 'dashboard' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => <TableCard key={table.id} table={table} order={ordersByTable.get(table.id)} alerts={pendingByTable.get(table.id) || []} onOpen={() => openTable.mutate(table.id)} onConfirm={confirm.mutate} onClose={close.mutate} onService={() => setServiceTable(table)} onQr={() => setQrTable(table)} onCancelOrder={cancelOrder.mutate} onAcknowledge={acknowledge.mutate} onCancelItem={cancelItem.mutate} />)}
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
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Rasm URL</span>
                  <input className="input rounded-2xl" placeholder="https://..." value={inventoryForm.image} onChange={(e) => setInventoryForm({ ...inventoryForm, image: e.target.value })} />
                </label>
                <label className="block">
                  <span className="label">Rasm fayli</span>
                  <input className="input rounded-2xl" type="file" accept="image/*" onChange={(e) => setInventoryImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              {inventoryImageFile && <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">Fayl tanlandi: {inventoryImageFile.name}</div>}
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
                  <div className="relative h-32 bg-slate-100 dark:bg-slate-800">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><PackageOpen /></div>}
                    <div className="absolute right-3 top-3 flex gap-2">
                      <button title="Tahrirlash" className="rounded-2xl bg-white/90 p-2 text-slate-700 shadow-sm dark:bg-slate-950/90 dark:text-slate-100" onClick={() => {
                        setEditExtra(item);
                        setInventoryForm({ name: item.name, category: item.category || 'Ichimlik', price: String(item.price), stockQuantity: String(item.stockQuantity), alertThreshold: String(item.alertThreshold), image: item.image || '' });
                        setInventoryImageFile(null);
                      }}><Edit3 size={16} /></button>
                      <button title="O‘chirish" className="rounded-2xl bg-white/90 p-2 text-red-600 shadow-sm dark:bg-slate-950/90 dark:text-red-400" onClick={() => deleteExtra.mutate(item.id)}><Trash2 size={16} /></button>
                    </div>
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
            <Metric label="Sessiyalar" value={analyticsTotalsFiltered.sessions} />
            <Metric label="Daqiqa" value={analyticsTotalsFiltered.minutes} />
            <Metric label="Jami tushum" value={formatCurrency(Number(analyticsTotalsFiltered.revenue))} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="label">Yil</span>
              <select className="input rounded-2xl" value={analyticsFilter.year} onChange={(e) => setAnalyticsFilter({ ...analyticsFilter, year: Number(e.target.value) })}>
                {Array.from({ length: analytics?.archiveYears || 5 }, (_, idx) => new Date().getFullYear() - idx).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Oy</span>
              <select className="input rounded-2xl" value={analyticsFilter.month} onChange={(e) => setAnalyticsFilter({ ...analyticsFilter, month: e.target.value })}>
                <option value="">Barchasi</option>
                {['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'].map((label, index) => (
                  <option key={label} value={index + 1}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Mijoz</span>
              <select className="input rounded-2xl" value={analyticsFilter.userId} onChange={(e) => setAnalyticsFilter({ ...analyticsFilter, userId: e.target.value })}>
                <option value="">Barchasi</option>
                {analyticsUsers.map((user: any) => (
                  <option key={user.userId} value={user.userId}>{user.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Filtrlangan stol va mijozlar</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {analyticsByTable.slice(0, 4).map((row: any) => (
                <div key={row.tableId} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-sm text-slate-500">{row.tableName}</p>
                  <p className="mt-1 text-lg font-semibold">{formatCurrency(Number(row.revenue))}</p>
                  <p className="text-xs text-slate-400">{row.sessions} sessiya · {row.minutes} min</p>
                </div>
              ))}
            </div>
            {analyticsByTable.length === 0 && <p className="py-8 text-center text-slate-400">Hech qanday yopilgan sessiya topilmadi</p>}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 font-semibold">Foydalanuvchilar bo‘yicha</h2>
              <div className="space-y-2">
                {analyticsByUser.slice(0, 5).map((user: any) => (
                  <div key={user.userId} className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
                    <span>{user.userName}</span>
                    <span>{user.sessions} sessiya</span>
                    <b className="text-right">{formatCurrency(Number(user.revenue))}</b>
                  </div>
                ))}
                {analyticsByUser.length === 0 && <p className="py-8 text-center text-slate-400">Mijozlar uchun ma'lumotlar yo'q</p>}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 font-semibold">Yakunlangan sessiyalar</h2>
              <div className="space-y-3">
                {filteredArchive.slice(0, 6).map((order: any) => (
                  <div key={order.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{order.table?.name || 'Stol'}</p>
                      <span className="text-xs text-slate-500">{order.user?.phone || 'Anonim'}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{order.closedAt ? new Date(order.closedAt).toLocaleDateString() : '—'}</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span>{order.durationMinutes} min</span>
                      <b>{formatCurrency(Number(order.total || 0))}</b>
                    </div>
                  </div>
                ))}
                {filteredArchive.length === 0 && <p className="py-8 text-center text-slate-400">Filtrlangan natija bo'yicha sessiyalar topilmadi</p>}
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Arxiv yakunlangan sessiyalarni 5 yilgacha saqlash mantiqi bilan olinadi.</p>
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

      {qrTable && (
        <Modal onClose={() => setQrTable(null)} title={`${qrTable.name}: QR kod`}>
          <div className="space-y-4 text-center">
            <div className="mx-auto rounded-3xl bg-slate-100 p-4 dark:bg-slate-900">
              <QRCode value={typeof window !== 'undefined' ? `${window.location.origin}/client/sport/${club?.id}/tables?tableId=${qrTable.id}` : `/client/sport/${club?.id}/tables?tableId=${qrTable.id}`} size={200} />
            </div>
            <p className="text-sm text-slate-500">Mijoz telefoniga skanerlash uchun foydalanilsin.</p>
            <button className="btn-secondary w-full rounded-2xl" onClick={() => {
              const text = typeof window !== 'undefined' ? `${window.location.origin}/client/sport/${club?.id}/tables?tableId=${qrTable.id}` : `/client/sport/${club?.id}/tables?tableId=${qrTable.id}`;
              navigator.clipboard.writeText(text).then(() => toast.success('Havola nusxalandi'));
            }}>Havolani nusxalash</button>
          </div>
        </Modal>
      )}

      {editExtra && (
        <Modal onClose={() => { setEditExtra(null); setInventoryImageFile(null); }} title="Ombor mahsulotini tahrirlash">
          <div className="space-y-3">
            <input className="input rounded-2xl" placeholder="Mahsulot nomi" value={inventoryForm.name} onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })} />
            <input className="input rounded-2xl" placeholder="Kategoriya" value={inventoryForm.category} onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="label">Rasm URL</span>
                <input className="input rounded-2xl" value={inventoryForm.image} onChange={(e) => setInventoryForm({ ...inventoryForm, image: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Rasm fayli</span>
                <input className="input rounded-2xl" type="file" accept="image/*" onChange={(e) => setInventoryImageFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input className="input rounded-2xl" placeholder="Narx" type="number" value={inventoryForm.price} onChange={(e) => setInventoryForm({ ...inventoryForm, price: e.target.value })} />
              <input className="input rounded-2xl" placeholder="Soni" type="number" value={inventoryForm.stockQuantity} onChange={(e) => setInventoryForm({ ...inventoryForm, stockQuantity: e.target.value })} />
              <input className="input rounded-2xl" placeholder="Ogohlantirish" type="number" value={inventoryForm.alertThreshold} onChange={(e) => setInventoryForm({ ...inventoryForm, alertThreshold: e.target.value })} />
            </div>
            <button className="btn-primary w-full rounded-2xl" onClick={() => updateExtra.mutate({ id: editExtra.id, payload: { name: inventoryForm.name, category: inventoryForm.category, price: Number(inventoryForm.price), stockQuantity: Number(inventoryForm.stockQuantity), alertThreshold: Number(inventoryForm.alertThreshold), image: inventoryForm.image } })}>Saqlash</button>
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

function NotificationCenter({ notifications, onClose, onClear }: { notifications: NotificationEntry[]; onClose: () => void; onClear: () => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Bildirishnoma markazi</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">So‘nggi real vaqt hodisalar uchun.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800" onClick={onClear}>Tozalash</button>
          <button className="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950" onClick={onClose}>Yopish</button>
        </div>
      </div>
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">Hech qanday bildirishnoma yo‘q.</div>
        ) : notifications.map((notification) => (
          <div key={notification.id} className={`rounded-3xl border p-4 ${notification.read ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300' : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{notification.message}</p>
              </div>
              <span className="text-[11px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableCard({ table, order, alerts, onOpen, onConfirm, onClose, onService, onQr, onCancelOrder, onAcknowledge, onCancelItem }: any) {
  const runningMinutes = order?.status === 'confirmed' ? minutesSince(order.confirmedAt || order.startAt) : 0;
  const runningCost = order?.status === 'confirmed' ? Math.ceil((runningMinutes / 60) * Number(order.pricePerHour || table.pricePerHour)) + Number(order.total || 0) : 0;
  return (
    <article className={`relative overflow-hidden rounded-3xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${alerts.length ? 'border-red-500 ring-4 ring-red-500/15' : 'border-slate-200 dark:border-slate-800'}`}>
      {alerts.length > 0 && <div className="absolute inset-x-0 top-0 bg-red-600 px-4 py-2 text-sm font-semibold text-white"><BellRing className="mr-2 inline h-4 w-4" />{table.name}: {alerts[0].quantity} ta {alerts[0].extra?.name || alerts[0].name} so‘rayapti</div>}
      <div className={alerts.length ? 'pt-10' : ''}>
        <div className="flex items-start justify-between">
          <div><h3 className="text-lg font-semibold">{table.name}</h3><p className="text-sm text-slate-500">{table.type?.name || 'Tarifsiz'} · {formatCurrency(Number(table.pricePerHour))}/soat</p></div>
          <div className="flex items-center gap-2">
            <span className={`badge ${table.status === 'free' ? 'badge-success' : table.status === 'reserved' ? 'badge-warning' : 'badge-danger'}`}>{table.status === 'free' ? 'Bo‘sh' : table.status === 'reserved' ? 'Kutilmoqda' : 'Band'}</span>
            <button className="btn-ghost rounded-2xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" onClick={onQr}>QR</button>
          </div>
        </div>
        {order ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><Clock size={16} /><p className="mt-1 font-semibold">{order.status === 'confirmed' ? `${runningMinutes} min` : 'Tasdiq kutyapti'}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><ReceiptText size={16} /><p className="mt-1 font-semibold">{formatCurrency(runningCost)}</p></div>
            </div>
            {order.status === 'pending' ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <button className="btn-success w-full rounded-2xl" onClick={() => onConfirm(order.id)}><Check size={16} /> Tasdiqlash</button>
                <button className="btn-danger w-full rounded-2xl" onClick={() => onCancelOrder(order.id)}><Trash2 size={16} /> Bekor qilish</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-secondary rounded-2xl" onClick={onService}><Plus size={16} /> Xizmat</button>
                <button className="btn-danger rounded-2xl" onClick={() => onClose(order.id)}><Timer size={16} /> Yopish</button>
              </div>
            )}
          </div>
        ) : (
          <button className="mt-4 h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950" onClick={onOpen}>Stolni ochish</button>
        )}
        {alerts.length > 0 && <div className="mt-3 space-y-2">{alerts.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">
            <span>{item.quantity} x {item.extra?.name || item.name}</span>
            <div className="flex gap-2">
              <button onClick={() => onAcknowledge(item.id)} className="rounded-xl bg-red-600 px-3 py-1 font-semibold text-white">Qabul qildim</button>
              <button onClick={() => onCancelItem(item.id)} className="rounded-xl bg-slate-200 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-100">Bekor</button>
            </div>
          </div>
        ))}</div>}
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
