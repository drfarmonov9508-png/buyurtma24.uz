"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { billiardApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function TablesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [tables, setTables] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
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
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  if (loading) return <p>Yuklanmoqda...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Stollar</h2>
      {activeSessions.length > 0 && (
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-slate-900 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/50 dark:text-emerald-100">
          <p className="font-semibold text-emerald-800 dark:text-emerald-200">Faol sessiyalaringiz mavjud</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Hozirgi band qilingan billiard stollar va ularning holati.</p>
          <div className="mt-4 space-y-3">
            {activeSessions.map((session) => (
              <div key={session.id} className="rounded-3xl border border-emerald-100 bg-white p-4 dark:border-emerald-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{session.table?.name || 'Billiard stol'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{session.club?.name || session.tenant?.name || 'Joy aniqlanmadi'}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-100">{session.status === 'confirmed' ? 'Tasdiqlangan' : 'Kutilmoqda'}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-xs">Davomiylik</p>
                    <p className="font-semibold">{session.durationMinutes ? `${session.durationMinutes} min` : '0 min'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-xs">Boshlanish</p>
                    <p className="font-semibold">{new Date(session.startAt || session.createdAt).toLocaleString('uz-UZ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tables.map((t) => (
          <div key={t.id} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t.name}</h3>
                <p className="text-sm text-gray-500">{t.seats || ''} o'rin</p>
              </div>
              <div>
                <button onClick={() => handleBook(t.id)} className="px-3 py-1 bg-primary-600 text-white rounded">Band qilish</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
