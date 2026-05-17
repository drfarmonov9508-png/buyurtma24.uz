"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { billiardApi, regionsApi } from '@/lib/api';
import { Dumbbell, MapPin, Search } from 'lucide-react';

const REGION_KEY = 'buyurtma24-region-id';

export default function SportPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [loading, setLoading] = useState(false);

  const load = (regionId?: string) => {
    setLoading(true);
    billiardApi.getClubs(regionId ? { regionId } : undefined)
      .then((res) => setClubs(res.data.data || res.data || []))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const saved = localStorage.getItem(REGION_KEY) || '';
    setSelectedRegion(saved);
    regionsApi.getTree()
      .then((r) => setRegions(r.data.data || r.data || []))
      .catch(() => setRegions([]));
    load(saved);
  }, []);

  const changeRegion = (value: string) => {
    setSelectedRegion(value);
    if (value) localStorage.setItem(REGION_KEY, value);
    else localStorage.removeItem(REGION_KEY);
    load(value);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Sport o'yinlari</h1>
          <p className="mt-1 text-sm text-slate-500">Billiarddan boshlaymiz, keyingi sport modullari shu yerda ko‘rinadi.</p>
        </div>
        <label className="block min-w-[240px]">
          <span className="label">Hudud</span>
          <select value={selectedRegion} onChange={(e) => changeRegion(e.target.value)} className="input">
            <option value="">Barcha hududlar</option>
            {regions.map((reg) => (
              <option key={reg.id} value={reg.id}>{reg.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <Dumbbell size={22} />
          </div>
          <div>
            <h2 className="font-semibold">Billiard klublar</h2>
            <p className="text-sm text-slate-500">{clubs.length} ta klub topildi</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Yuklanmoqda...</div>
        ) : clubs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Search className="mx-auto mb-3 h-9 w-9" />
            Tanlangan hududda billiard klublar topilmadi
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((c) => (
              <Link key={c.id} href={`/client/sport/${c.id}`} className="rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800">
                <div className="mb-4 h-24 rounded-2xl bg-gradient-to-br from-slate-950 to-emerald-800 p-4 text-white">
                  <p className="text-xs text-emerald-100">Billiard</p>
                  <h3 className="mt-2 line-clamp-2 font-semibold">{c.name}</h3>
                </div>
                <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} /> {c.landmark || c.address || c.city || 'Manzil kiritilmagan'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
