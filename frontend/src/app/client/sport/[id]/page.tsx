"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { billiardApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TIER_LABELS, tierBadgeClass } from '@/lib/billiard';
import { ArrowRight, MapPin, Phone, CircleDot, Clock } from 'lucide-react';

export default function ClubPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [club, setClub] = useState<any>(null);
  const [types, setTypes] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      billiardApi.getClub(id).then((r) => r.data?.data ?? r.data),
      billiardApi.getTypes(id).then((r) => r.data?.data ?? r.data ?? []).catch(() => []),
      billiardApi.getTables(id).then((r) => r.data?.data ?? r.data ?? []).catch(() => []),
    ]).then(([clubData, typesData, tablesData]) => {
      setClub(clubData);
      setTypes(Array.isArray(typesData) ? typesData : []);
      setTables(Array.isArray(tablesData) ? tablesData : []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!club) return <p className="text-center text-slate-400 py-10">Klub topilmadi</p>;

  const freeCount = tables.filter((t) => t.status === 'free').length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <section className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-xl">
        {club.coverImage && (
          <div className="h-40 w-full">
            <img src={club.coverImage} alt={club.name} className="h-full w-full object-cover opacity-70" />
          </div>
        )}
        <div className="p-6">
          <p className="text-sm text-emerald-300">Billiard klubi</p>
          <h1 className="mt-2 text-3xl font-bold">{club.name}</h1>
          {club.description && <p className="mt-3 text-sm leading-6 text-slate-300">{club.description}</p>}
          <div className="mt-5 space-y-2 text-sm text-slate-300">
            <p className="flex items-center gap-2"><MapPin size={16} /> {[club.city, club.landmark || club.address].filter(Boolean).join(' · ')}</p>
            {club.phone && <p className="flex items-center gap-2"><Phone size={16} /> {club.phone}</p>}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{tables.length} stol</span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">{freeCount} bo'sh</span>
          </div>
        </div>
      </section>

      {types.length > 0 && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-semibold">Tariflar</h2>
          <p className="mt-1 text-sm text-slate-500">Stollar ushbu tariflar bo'yicha narxlanadi</p>
          <div className="mt-4 space-y-3">
            {types.map((type) => (
              <div key={type.id} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tierBadgeClass(type.tier)}`}>
                      {TIER_LABELS[type.tier] || type.name}
                    </span>
                    <p className="font-semibold">{type.name}</p>
                  </div>
                  {type.details && <p className="mt-1 text-xs text-slate-500">{type.details}</p>}
                </div>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(Number(type.pricePerHour))}<span className="text-sm font-normal text-slate-500">/soat</span></p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <CircleDot className="text-emerald-500" />
          <div>
            <h2 className="font-semibold">Qanday ishlaydi?</h2>
            <p className="text-sm text-slate-500">3 oddiy qadam</p>
          </div>
        </div>
        <ol className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900"><span className="font-bold text-emerald-600">1.</span> Bo'sh stolni tanlang</li>
          <li className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900"><span className="font-bold text-emerald-600">2.</span> Admin tasdiqlagach vaqt avtomatik boshlanadi</li>
          <li className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900"><span className="font-bold text-emerald-600">3.</span> <Clock size={14} className="mt-0.5 shrink-0" /> Narx sessiya yopilganda hisoblanadi</li>
        </ol>
      </section>

      <Link href={`/client/sport/${id}/tables`} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-base font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
        Stollarni ko'rish <ArrowRight size={18} />
      </Link>
    </div>
  );
}
