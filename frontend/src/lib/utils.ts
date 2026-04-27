import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'UZS') {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...opts,
  }).format(new Date(date));
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function timeSince(date: string | Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function truncate(str: string, len = 30) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Yangi',
  CONFIRMED: 'Qabul qilindi',
  PREPARING: 'Tayyorlanmoqda',
  READY: 'Tayyor',
  SERVED: 'Berildi',
  COMPLETED: 'Tugallandi',
  CANCELLED: 'Bekor qilindi',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  SERVED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  CAFE_ADMIN: 'Cafe Admin',
  CASHIER: 'Kassir',
  WAITER: 'Ofitsiant',
  KITCHEN: 'Oshpaz',
  CLIENT: 'Mijoz',
};

export const TABLE_STATUS_LABELS: Record<string, string> = {
  FREE: "Bo'sh",
  OCCUPIED: 'Band',
  RESERVED: 'Bron',
};

export const TABLE_STATUS_COLORS: Record<string, string> = {
  FREE: 'bg-green-500',
  OCCUPIED: 'bg-red-500',
  RESERVED: 'bg-yellow-500',
};
