'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { billiardApi, clientApi, publicApi } from '@/lib/api';
import { Store, History, Star, ArrowRight, Clock, Clock3, Users } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: historyData } = useQuery({
    queryKey: ['client-dashboard-history'],
    queryFn: () => clientApi.getHistory({ limit: 40 }).then((r) => r.data?.data ?? r.data),
    staleTime: 1000 * 60 * 2,
  });

  const { data: billiardOrdersData } = useQuery({
    queryKey: ['client-billiard-sessions'],
    queryFn: () => billiardApi.getMyOrders().then((r) => r.data?.data ?? r.data),
    staleTime: 1000 * 60 * 2,
  });

  const historyEntries: any[] = Array.isArray(historyData) ? historyData : Array.isArray(historyData?.data) ? historyData.data : [];
  const billiardSessions: any[] = Array.isArray(billiardOrdersData) ? billiardOrdersData : Array.isArray(billiardOrdersData?.data) ? billiardOrdersData.data : [];

  const activeSessions = billiardSessions.filter((order) => !['completed', 'cancelled'].includes(order.status));
  const lastSession = [...historyEntries]
    .sort((a, b) => new Date(b.closedAt || b.updatedAt || b.createdAt).getTime() - new Date(a.closedAt || a.updatedAt || a.createdAt).getTime())[0];

  useEffect(() => {
    publicApi.getTenants()
      .then((res) => {
        const raw = res?.data;
        const list = raw?.data ?? raw;
        setTenants(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Salom, {user?.firstName || 'Mehmon'}!
        </h1>
        <p className="text-gray-500 mt-1">Buyurtma24 platformasiga xush kelibsiz</p>
      </div>

      {(activeSessions.length > 0 || lastSession) && (
        <div className="grid gap-4 md:grid-cols-2">
          {activeSessions.length > 0 ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/60">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-emerald-600 dark:bg-slate-900"><Clock size={24} /></div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Faol sessiyalar</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Sizning hozirgi billiard sessiyalaringiz ro‘yxati.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {activeSessions.map((session: any) => (
                  <div key={session.id} className="rounded-3xl border border-emerald-100 bg-white p-3 text-sm text-slate-700 dark:border-emerald-800 dark:bg-slate-900 dark:text-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{session.table?.name || 'Billiard stol'}</p>
                        <p className="text-xs text-slate-500">{session.club?.name || session.tenant?.name || 'Joy tanlanmagan'}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-100">{session.status === 'confirmed' ? 'Tasdiqlangan' : 'Kutilmoqda'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{session.durationMinutes ? `${session.durationMinutes} min` : 'Davomiylik yo‘q'}</span>
                      <span>{new Date(session.startAt || session.confirmedAt || session.createdAt).toLocaleString('uz-UZ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {lastSession ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-200"><Users size={24} /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Oxirgi sessiya</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Oxirgi band qilingan stol va davomiylik.</p>
                </div>
              </div>
              <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-base font-semibold text-slate-900 dark:text-white">{lastSession.table?.name || 'Billiard stol'}</p>
                <p className="text-xs text-slate-500 mt-1">{lastSession.club?.name || lastSession.tenant?.name || 'Joy aniqlanmadi'}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-white px-2 py-1 dark:bg-slate-800">{lastSession.durationMinutes || '—'} min</span>
                  <span className="rounded-full bg-white px-2 py-1 dark:bg-slate-800">{new Date(lastSession.closedAt || lastSession.createdAt).toLocaleDateString('uz-UZ')}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/client/places" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <Store size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Tashkilotlar</p>
              <p className="text-xs text-gray-400">Kafe, restoran, market...</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
          </div>
        </Link>

        <Link href="/client/history" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <History size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Buyurtma tarixi</p>
              <p className="text-xs text-gray-400">Barcha buyurtmalaringiz</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>

        <Link href="/client/ratings" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center">
              <Star size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Baholarim</p>
              <p className="text-xs text-gray-400">Baho qo'ygan joylarim</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-yellow-500 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Available tenants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mavjud tashkilotlar</h2>
          <Link href="/client/places" className="text-sm text-primary-600 hover:text-primary-700">Barchasi</Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Yuklanmoqda...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Hozircha tashkilotlar yo'q</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tenants.slice(0, 6).map((t: any) => (
              <Link
                key={t.id}
                href={`/menu/${t.slug}`}
                className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                  <Store size={20} className="text-primary-600 dark:text-primary-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{t.name}</p>
                  {t.address && <p className="text-xs text-gray-400 truncate">{t.address}</p>}
                  {t.city && <p className="text-xs text-gray-400">{t.city}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
