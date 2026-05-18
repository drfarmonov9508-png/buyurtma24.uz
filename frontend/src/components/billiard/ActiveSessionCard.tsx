'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SessionTimer from '@/components/billiard/SessionTimer';
import { getSessionStart, ORDER_STATUS_LABELS } from '@/lib/billiard';

type ActiveSessionCardProps = {
  session: any;
  variant?: 'dashboard' | 'detail';
  href?: string;
  theme?: 'light' | 'dark';
};

export default function ActiveSessionCard({ session, variant = 'detail', href, theme = 'light' }: ActiveSessionCardProps) {
  const isConfirmed = session.status === 'confirmed';
  const startAt = isConfirmed ? getSessionStart(session) : undefined;
  const clubName = session.club?.name || 'Klub';
  const tableName = session.table?.name || 'Stol';
  const dark = theme === 'dark';

  const content = (
    <div className={`overflow-hidden rounded-[24px] border ${
      dark
        ? isConfirmed
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-amber-500/20 bg-amber-500/5'
        : isConfirmed
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white'
          : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'
    }`}>
      <div className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${dark ? 'text-white/40' : 'text-slate-500'}`}>{clubName}</p>
            <h3 className={`mt-1 text-xl font-semibold ${dark ? 'text-white' : 'text-slate-950'}`}>{tableName}</h3>
            {session.table?.type?.name && (
              <p className={`mt-1 text-sm ${dark ? 'text-white/50' : 'text-slate-500'}`}>
                {session.table.type.name} · {Number(session.pricePerHour || session.table?.pricePerHour || 0).toLocaleString()} so'm/soat
              </p>
            )}
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            isConfirmed
              ? dark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
              : dark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
          }`}>
            {ORDER_STATUS_LABELS[session.status as keyof typeof ORDER_STATUS_LABELS] || session.status}
          </span>
        </div>

        {isConfirmed ? (
          <div className={`mt-5 rounded-[20px] p-4 ${dark ? 'bg-white/[0.04]' : 'bg-white/80'}`}>
            <SessionTimer startAt={startAt} active size={variant === 'dashboard' ? 'md' : 'lg'} />
          </div>
        ) : (
          <div className={`mt-4 rounded-[20px] border border-dashed p-4 text-sm ${
            dark ? 'border-amber-500/30 text-amber-300/80' : 'border-amber-200 text-amber-800'
          }`}>
            Tasdiqlanmoqda...
          </div>
        )}

        {href && (
          <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <ArrowRight size={16} />
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block transition hover:scale-[1.01]">{content}</Link>;
  }

  return content;
}
