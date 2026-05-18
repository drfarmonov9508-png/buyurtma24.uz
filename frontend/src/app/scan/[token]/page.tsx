'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { billiardApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';
import { CircleDot, ArrowRight, Users } from 'lucide-react';
import { TIER_LABELS, statusBadgeClass, TABLE_STATUS_LABELS } from '@/lib/billiard';

export default function ScanPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [table, setTable] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    billiardApi.getTableByQr(token)
      .then((r) => setTable(r.data?.data ?? r.data))
      .catch(() => setTable(null))
      .finally(() => setLoading(false));
  }, [token]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return toast.error('Telefon kiriting');
    setBooking(true);
    try {
      const res = await billiardApi.bookTableByQr(token, phone.trim());
      const payload = res.data?.data ?? res.data;
      if (payload?.accessToken) {
        Cookies.set('accessToken', payload.accessToken, { expires: 7 });
        Cookies.set('refreshToken', payload.refreshToken, { expires: 30 });
      }
      if (payload?.user) setUser(payload.user);
      toast.success('Band qilish yuborildi! Admin tasdiqlashini kuting.');
      router.push(payload?.table?.clubId ? `/client/sport/${payload.table.clubId}/tables` : '/client');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060a10]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060a10] px-4 text-center text-white/50">
        QR kod noto'g'ri yoki stol topilmadi
      </div>
    );
  }

  const isFree = table.status === 'free';
  const tier = table.type?.tier || 'oddiy';

  return (
    <main className="min-h-screen bg-[#060a10] px-4 py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_50%)]" />
      <div className="relative mx-auto max-w-md space-y-5">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-[#060a10]">
            <CircleDot size={28} />
          </div>
        </div>

        <div className="client-card overflow-hidden">
          <div className="border-b border-white/[0.06] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">{table.club?.name}</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{table.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(table.status)}`}>
                {TABLE_STATUS_LABELS[table.status as keyof typeof TABLE_STATUS_LABELS]}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">{TIER_LABELS[tier]}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-white/[0.06]">
            <div className="bg-[#0a1018] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Tarif</p>
              <p className="mt-1 font-bold text-white">{formatCurrency(Number(table.pricePerHour))}/soat</p>
            </div>
            <div className="bg-[#0a1018] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Sig'im</p>
              <p className="mt-1 flex items-center gap-1 font-bold text-white"><Users size={14} /> {table.capacity}</p>
            </div>
          </div>
        </div>

        {isFree ? (
          <form onSubmit={handleBook} className="client-card space-y-3 p-5">
            <input
              className="client-input h-14"
              type="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              disabled={booking}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {booking ? '...' : <><span>Band qilish</span><ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          <div className="client-card p-5 text-center text-amber-300/90">
            Stol hozir band. Boshqa stolni tanlang.
          </div>
        )}
      </div>
    </main>
  );
}
