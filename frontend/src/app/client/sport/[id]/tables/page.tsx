"use client";

import { useEffect, useState } from 'react';
import { billiardApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export default function TablesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [tables, setTables] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [showTables, setShowTables] = useState(false);
  const [now, setNow] = useState(Date.now());
  const user = useAuthStore((s) => s.user);

  const loadActiveSessions = async () => {
    if (!user) return;
    setSessionLoading(true);
    try {
      const res = await billiardApi.getMyOrders();
      const raw = res.data?.data ?? res.data;
      const sessions = Array.isArray(raw) ? raw : [];
      setActiveSessions(sessions.filter((order) => !['completed', 'cancelled'].includes(order.status)));
    } catch {
      setActiveSessions([]);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    billiardApi.getTables(id).then((res) => setTables(res.data.data || [])).catch(() => {}).finally(() => setLoading(false));
    loadActiveSessions();
  }, [id, user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleBook = async (tableId: string) => {
    if (!user) {
      toast.error('Iltimos avval tizimga kiring');
      return;
    }
    const duration = parseInt(prompt('Davomiylik (minutlarda)', '60') || '60', 10);
    try {
      await billiardApi.bookTable(tableId, { startAt: new Date().toISOString(), durationMinutes: duration });
      toast.success('Muvaffaqiyatli buyurtma yuborildi');
      loadActiveSessions();
      setShowTables(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const confirmedSessions = activeSessions.filter((session) => session.status === 'confirmed');
  const pendingSessions = activeSessions.filter((session) => session.status !== 'confirmed');

  if (loading) return <p className="text-center py-10 text-slate-500">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      <div className="rounded-[32px] bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Billiard</p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Stolni tanlang</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            Faol sessiyalar, soat bo‘yicha hisoblash va qo‘shimcha buyurtmalar endi mobil uchun juda qulay.
          </p>
        </div>
      </div>

      {sessionLoading && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300">
          Sessiyalar yuklanmoqda...
        </div>
      )}

      {activeSessions.length > 0 && (
        <div className="space-y-4 rounded-[32px] border border-emerald-200 bg-emerald-50 p-5 shadow-lg shadow-emerald-100/40 dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-base font-semibold text-emerald-900 dark:text-emerald-200">Faol sessiyalaringiz mavjud</p>
              <p className="mt-1 max-w-2xl text-sm text-emerald-700 dark:text-emerald-300">
                Hozirgi stollar, vaqt va qo‘shimcha buyurtmalar mobil skrinchalar uchun optimallashtirilgan.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
              {activeSessions.length} ta faol sessiya
            </span>
          </div>

          <div className="grid gap-4">
            {confirmedSessions.map((session) => {
              const start = session.startAt ? new Date(session.startAt).getTime() : new Date(session.createdAt).getTime();
              const elapsed = Math.max(0, Math.floor((now - start) / 1000));
              return (
                <div key={session.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{session.table?.name || 'Billiard stol'}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{session.club?.name || session.tenant?.name || 'Joy aniqlanmadi'}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                      Tasdiqlangan
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-4 text-sm font-medium text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">O‘tkazilgan vaqt</p>
                      <p className="mt-2 text-xl font-semibold">{formatSeconds(elapsed)}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4 text-sm font-medium text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Boshlanish</p>
                      <p className="mt-2 text-base font-semibold">{new Date(session.startAt || session.createdAt).toLocaleString('uz-UZ')}</p>
                    </div>
                  </div>

                  {session.items?.length > 0 && (
                    <div className="mt-4 rounded-[28px] bg-slate-100 p-4 dark:bg-slate-900">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Qo‘shimcha buyurtmalar</p>
                      <div className="mt-3 space-y-3">
                        {session.items.map((item: any) => (
                          <div key={item.id} className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-sm dark:bg-slate-950">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{item.extra?.name || 'Qo‘shimcha xizmat'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{item.quantity} ta</p>
                              </div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.price ? `${item.price} so'm` : '—'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {pendingSessions.map((session) => (
              <div key={session.id} className="overflow-hidden rounded-[28px] border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{session.table?.name || 'Billiard stol'}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{session.club?.name || session.tenant?.name || 'Joy aniqlanmadi'}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:bg-amber-900/50 dark:text-amber-100">
                    Kutilmoqda
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Admin tomonidan tasdiqlanishini kuting.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSessions.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowTables((prev) => !prev)}
            className="w-full max-w-md rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-950 dark:text-white dark:ring-slate-800 dark:hover:bg-slate-900"
          >
            {showTables ? 'Bo‘sh stollarni yashirish' : 'Qo‘shimcha stol buyurtma qilish'}
          </button>
        </div>
      )}

      {(activeSessions.length === 0 || showTables) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {tables.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.seats ? `${t.seats} o'rin` : 'O‘rinlar mavjud'}</p>
                </div>
                <button
                  onClick={() => handleBook(t.id)}
                  className="w-full rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  Band qilish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
