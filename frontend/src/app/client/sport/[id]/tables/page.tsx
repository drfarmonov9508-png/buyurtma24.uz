"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { billiardApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useBilliardSocket } from '@/hooks/useBilliardSocket';
import ActiveSessionCard from '@/components/billiard/ActiveSessionCard';
import ClientTableCard from '@/components/billiard/ClientTableCard';
import ClientExtrasPanel from '@/components/billiard/ClientExtrasPanel';
import { isActiveSession } from '@/lib/billiard';
import { ArrowLeft, CircleDot, RefreshCw } from 'lucide-react';

export default function TablesPage({ params }: { params: { id: string } }) {
  const { id: clubId } = params;
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [showTables, setShowTables] = useState(false);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['billiard-tables', clubId] });
    qc.invalidateQueries({ queryKey: ['billiard-my-orders'] });
  }, [qc, clubId]);

  useBilliardSocket({
    clubId,
    userId: user?.id,
    enabled: !!clubId,
    onEvent: refresh,
  });

  const { data: club } = useQuery({
    queryKey: ['billiard-club', clubId],
    queryFn: () => billiardApi.getClub(clubId).then((r) => r.data?.data ?? r.data),
  });

  const { data: tables = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['billiard-tables', clubId],
    queryFn: () => billiardApi.getTables(clubId).then((r) => r.data?.data ?? r.data ?? []),
    refetchInterval: 20000,
  });

  const { data: myOrders = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['billiard-my-orders'],
    queryFn: () => billiardApi.getMyOrders().then((r) => r.data?.data ?? r.data ?? []),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const activeSessions = useMemo(
    () => (myOrders as any[]).filter((o) => isActiveSession(o.status) && o.clubId === clubId),
    [myOrders, clubId],
  );

  const bookMutation = useMutation({
    mutationFn: (tableId: string) => billiardApi.bookTable(tableId),
    onSuccess: () => {
      toast.success('Band qilish so\'rovi yuborildi. Admin tasdiqlashini kuting.');
      refresh();
      setShowTables(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik yuz berdi'),
  });

  useEffect(() => {
    if (activeSessions.length === 0) setShowTables(true);
  }, [activeSessions.length]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 pb-8">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/client/sport/${clubId}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Orqaga
        </Link>
        <button
          onClick={() => refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Yangilash
        </button>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 to-transparent p-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{club?.name || 'Stollar'}</h1>
      </section>

      {!sessionsLoading && activeSessions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Faol sessiyalar</h2>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{activeSessions.length}</span>
          </div>
          <div className="grid gap-4">
            {activeSessions.map((session) => (
              <div key={session.id} className="space-y-4">
                <ActiveSessionCard session={session} variant="detail" theme="dark" />
                {session.status === 'confirmed' && (
                  <ClientExtrasPanel clubId={clubId} session={session} onOrdered={refresh} />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowTables((v) => !v)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            {showTables ? 'Stollar ro\'yxatini yashirish' : 'Yana stol band qilish'}
          </button>
        </section>
      )}

      {(showTables || activeSessions.length === 0) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mavjud stollar</h2>
            <p className="text-sm text-slate-500">{(tables as any[]).filter((t) => t.status === 'free').length} ta bo'sh</p>
          </div>
          {(tables as any[]).length === 0 ? (
            <div className="rounded-[28px] border border-dashed py-14 text-center text-slate-400">
              <CircleDot className="mx-auto mb-2 h-8 w-8" />
              Stollar topilmadi
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(tables as any[]).map((table) => (
                <ClientTableCard
                  key={table.id}
                  table={table}
                  onBook={() => bookMutation.mutate(table.id)}
                  booking={bookMutation.isPending && bookMutation.variables === table.id}
                  disabled={!user}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
