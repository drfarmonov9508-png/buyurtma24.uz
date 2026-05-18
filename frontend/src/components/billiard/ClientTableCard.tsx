'use client';

import { Users, CircleDot } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { statusBadgeClass, TABLE_STATUS_LABELS, tierBadgeClass, TIER_LABELS } from '@/lib/billiard';

type ClientTableCardProps = {
  table: any;
  onBook?: () => void;
  booking?: boolean;
  disabled?: boolean;
};

export default function ClientTableCard({ table, onBook, booking, disabled }: ClientTableCardProps) {
  const isFree = table.status === 'free';
  const tier = table.type?.tier || 'oddiy';

  return (
    <article className="client-card group relative overflow-hidden transition hover:bg-white/[0.06]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-[#060a10]">
              <CircleDot size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{table.name}</h3>
              <p className="text-sm text-white/45">{table.type?.name || TIER_LABELS[tier]}</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(table.status)}`}>
            {TABLE_STATUS_LABELS[table.status as keyof typeof TABLE_STATUS_LABELS] || table.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Tarif</p>
            <p className="mt-1 text-sm font-bold text-white">{formatCurrency(Number(table.pricePerHour))}/soat</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Sig‘im</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-bold text-white">
              <Users size={14} /> {table.capacity || 4}
            </p>
          </div>
        </div>

        {table.type?.details && (
          <p className="mt-3 rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300/80">
            {table.type.details}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tierBadgeClass(tier)}`}>
            {TIER_LABELS[tier] || tier}
          </span>
        </div>

        {onBook && (
          <button
            onClick={onBook}
            disabled={!isFree || disabled || booking}
            className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-emerald-500/15 disabled:opacity-40"
          >
            {booking ? '...' : isFree ? 'Band qilish' : 'Band'}
          </button>
        )}
      </div>
    </article>
  );
}
