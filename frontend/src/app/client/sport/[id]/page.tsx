"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { billiardApi } from '@/lib/api';
import { ArrowRight, MapPin, Phone } from 'lucide-react';

export default function ClubPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    billiardApi.getClub(id).then((res) => setClub(res.data.data ?? res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-slate-400">Yuklanmoqda...</p>;
  if (!club) return <p className="text-slate-400">Klub topilmadi</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
        <p className="text-sm text-emerald-200">Billiard klubi</p>
        <h1 className="mt-2 text-3xl font-semibold">{club.name}</h1>
        <div className="mt-5 space-y-2 text-sm text-slate-300">
          <p className="flex items-center gap-2"><MapPin size={16} /> {[club.city, club.landmark || club.address].filter(Boolean).join(' · ')}</p>
          {club.phone && <p className="flex items-center gap-2"><Phone size={16} /> {club.phone}</p>}
        </div>
      </div>
      <Link href={`/client/sport/${id}/tables`} className="btn-primary h-12 w-full rounded-2xl">
        Stollarni ko‘rish <ArrowRight size={16} />
      </Link>
    </div>
  );
}
