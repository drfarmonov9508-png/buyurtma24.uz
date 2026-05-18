export type BilliardTableStatus = 'free' | 'occupied' | 'reserved';
export type BilliardOrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export const TIER_LABELS: Record<string, string> = {
  oddiy: 'Oddiy',
  pro: 'Pro',
  vip: 'Premium / VIP',
};

export const TABLE_STATUS_LABELS: Record<BilliardTableStatus, string> = {
  free: "Bo'sh",
  occupied: 'Band',
  reserved: 'Kutilmoqda',
};

export const ORDER_STATUS_LABELS: Record<BilliardOrderStatus, string> = {
  pending: 'Tasdiq kutilmoqda',
  confirmed: 'Faol sessiya',
  cancelled: 'Bekor qilindi',
  completed: 'Yakunlangan',
};

export function getBilliardScanUrl(qrToken: string) {
  if (typeof window !== 'undefined') return `${window.location.origin}/scan/${qrToken}`;
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/scan/${qrToken}`;
}

export function getSocketBase() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
}

export function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

export function getSessionStart(order: { confirmedAt?: string; startAt?: string; createdAt?: string }) {
  return order.confirmedAt || order.startAt || order.createdAt;
}

export function getElapsedSeconds(order: { confirmedAt?: string; startAt?: string; createdAt?: string }, now = Date.now()) {
  const start = getSessionStart(order);
  if (!start) return 0;
  return Math.max(0, Math.floor((now - new Date(start).getTime()) / 1000));
}

export function getElapsedMinutes(order: { confirmedAt?: string; startAt?: string; createdAt?: string }, now = Date.now()) {
  return Math.max(1, Math.ceil(getElapsedSeconds(order, now) / 60));
}

export function estimateSessionCost(order: { confirmedAt?: string; startAt?: string; createdAt?: string; pricePerHour?: number; items?: { price: number; quantity: number; status?: string }[] }, now = Date.now()) {
  const minutes = getElapsedMinutes(order, now);
  const hourly = Number(order.pricePerHour || 0);
  const tableCost = Number(((minutes / 60) * hourly).toFixed(2));
  const acceptedItems = (order.items || []).filter((i) => !i.status || i.status === 'accepted');
  const extras = acceptedItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  return { minutes, tableCost, extras, total: Number((tableCost + extras).toFixed(2)) };
}

export function isActiveSession(status: string) {
  return !['completed', 'cancelled'].includes(status);
}

export function tierBadgeClass(tier?: string) {
  switch (tier) {
    case 'vip': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200';
    case 'pro': return 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }
}

export function statusBadgeClass(status: BilliardTableStatus) {
  switch (status) {
    case 'free': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200';
    case 'occupied': return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200';
    default: return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200';
  }
}
