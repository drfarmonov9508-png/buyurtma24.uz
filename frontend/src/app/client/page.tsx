'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { billiardApi, clientApi } from '@/lib/api';
import { useBilliardSocket } from '@/hooks/useBilliardSocket';
import ActiveSessionCard from '@/components/billiard/ActiveSessionCard';
import { isActiveSession } from '@/lib/billiard';
import { Dumbbell, History, Star, ArrowRight, CircleDot, Clock3 } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['client-billiard-sessions'] });
    qc.invalidateQueries({ queryKey: ['client-dashboard-history'] });
  }, [qc]);

  useBilliardSocket({ userId: user?.id, enabled: !!user?.id, onEvent: refresh });

  const { data: billiardOrdersData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['client-billiard-sessions'],
    queryFn: () => billiardApi.getMyOrders().then((r) => r.data?.data ?? r.data),
    refetchInterval: 15000,
  });

  const { data: historyData } = useQuery({
    queryKey: ['client-dashboard-history'],
    queryFn: () => clientApi.getHistory({ limit: 10 }).then((r) => r.data?.data ?? r.data),
  });

  const billiardSessions: any[] = Array.isArray(billiardOrdersData) ? billiardOrdersData : [];
  const activeSessions = billiardSessions.filter((o) => isActiveSession(o.status));
  const historyEntries: any[] = Array.isArray(historyData) ? historyData : [];
  const lastBilliard = historyEntries.find((e) => e.historyType === 'billiard');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{user?.firstName || 'Mehmon'}</h1>
          </div>
          <Link
            href="/client/sport"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20"
          >
            <Dumbbell size={18} /> Sport
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">Faol sessiyalar</h2>
          {activeSessions.length > 0 && (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
              {activeSessions.length}
            </span>
          )}
        </div>

        {sessionsLoading ? (
          <div className="client-card p-8 text-center text-white/40">...</div>
        ) : activeSessions.length === 0 ? (
          <div className="client-card p-8 text-center">
            <CircleDot className="mx-auto mb-3 h-10 w-10 text-white/20" />
            <Link href="/client/sport" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
              Klublar <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeSessions.map((session) => (
              <ActiveSessionCard
                key={session.id}
                session={session}
                variant="dashboard"
                theme="dark"
                href={session.clubId ? `/client/sport/${session.clubId}/tables` : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {lastBilliard && (
        <section className="client-card flex items-center gap-3 p-5">
          <div className="rounded-xl bg-white/5 p-3 text-emerald-400"><Clock3 size={20} /></div>
          <div>
            <p className="text-sm font-medium text-white">{lastBilliard.table?.name}</p>
            <p className="text-xs text-white/40">{lastBilliard.durationMinutes} min</p>
          </div>
        </section>
      )}

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { href: '/client/sport', icon: Dumbbell, color: 'text-emerald-400' },
          { href: '/client/history', icon: History, color: 'text-amber-400' },
          { href: '/client/ratings', icon: Star, color: 'text-yellow-400' },
        ].map(({ href, icon: Icon, color }) => (
          <Link key={href} href={href} className="client-card flex flex-col items-center gap-2 p-4 transition hover:bg-white/[0.06]">
            <Icon size={22} className={color} />
          </Link>
        ))}
      </section>
    </div>
  );
}
