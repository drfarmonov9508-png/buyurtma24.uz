'use client';

import { formatTimer } from '@/lib/billiard';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { Timer } from 'lucide-react';

type SessionTimerProps = {
  startAt?: string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
};

const sizes = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl sm:text-6xl',
};

export default function SessionTimer({ startAt, active = true, size = 'md', showLabel = true, className = '' }: SessionTimerProps) {
  const { seconds } = useSessionTimer(active && !!startAt, startAt);

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          <Timer size={14} className={active ? 'animate-pulse text-emerald-500' : ''} />
          {active ? 'Jonli vaqt' : 'Vaqt'}
        </div>
      )}
      <p className={`font-mono font-bold tabular-nums tracking-tight ${size === 'lg' ? 'text-white' : 'text-white'} ${sizes[size]}`}>
        {formatTimer(seconds)}
      </p>
    </div>
  );
}
