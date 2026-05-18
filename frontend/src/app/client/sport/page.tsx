"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { billiardApi, regionsApi } from '@/lib/api';
import { ArrowRight, CircleDot, Dumbbell, MapPin, Search } from 'lucide-react';

const REGION_KEY = 'buyurtma24-region-id';
const CITY_KEY = 'buyurtma24-city-name';

export default function SportPage() {
  const [module, setModule] = useState<'billiard' | null>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedRegionItem = useMemo(() => regions.find((r) => r.id === selectedRegion), [regions, selectedRegion]);
  const districts: any[] = selectedRegionItem?.children || [];

  const load = (regionId?: string, city?: string) => {
    setLoading(true);
    billiardApi.getClubs({ ...(regionId ? { regionId } : {}), ...(city ? { city } : {}) })
      .then((res) => setClubs(res.data.data || res.data || []))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const savedRegion = localStorage.getItem(REGION_KEY) || '';
    const savedCity = localStorage.getItem(CITY_KEY) || '';
    setSelectedRegion(savedRegion);
    setSelectedCity(savedCity);
    regionsApi.getTree()
      .then((r) => setRegions(r.data.data || r.data || []))
      .catch(() => setRegions([]));
    load(savedRegion, savedCity);
  }, []);

  const changeRegion = (value: string) => {
    setSelectedRegion(value);
    setSelectedCity('');
    if (value) localStorage.setItem(REGION_KEY, value);
    else localStorage.removeItem(REGION_KEY);
    localStorage.removeItem(CITY_KEY);
    load(value, '');
  };

  const changeCity = (value: string) => {
    setSelectedCity(value);
    if (value) localStorage.setItem(CITY_KEY, value);
    else localStorage.removeItem(CITY_KEY);
    load(selectedRegion, value);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 to-transparent p-6">
        <h1 className="text-2xl font-bold text-white">Sport</h1>
      </section>

      {!module && (
        <button
          onClick={() => setModule('billiard')}
          className="client-card group w-full p-6 text-left transition hover:bg-white/[0.06]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-[#060a10]">
            <CircleDot size={26} />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">Billiard</h2>
          <ArrowRight size={16} className="mt-4 text-emerald-400" />
        </button>
      )}

      {module === 'billiard' && (
        <div className="space-y-5">
          <div className="client-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <Dumbbell size={22} />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Klublar</h2>
                  <p className="text-sm text-white/40">{clubs.length} ta</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block w-full">
                  <select value={selectedRegion} onChange={(e) => changeRegion(e.target.value)} className="client-input h-11">
                    <option value="" className="bg-[#0a1018]">Barcha viloyatlar</option>
                    {regions.map((reg) => <option key={reg.id} value={reg.id} className="bg-[#0a1018]">{reg.name}</option>)}
                  </select>
                </label>
                <label className="block w-full">
                  <select value={selectedCity} onChange={(e) => changeCity(e.target.value)} className="client-input h-11" disabled={!selectedRegion}>
                    <option value="" className="bg-[#0a1018]">Barchasi</option>
                    {districts.map((district) => <option key={district.id} value={district.name} className="bg-[#0a1018]">{district.name}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Yuklanmoqda...</div>
          ) : clubs.length === 0 ? (
            <div className="client-card py-14 text-center text-white/40">
              <Search className="mx-auto mb-3 h-9 w-9" />
              Tanlangan hududda billiard klublar topilmadi
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((c) => (
                <Link key={c.id} href={`/client/sport/${c.id}`} className="client-card overflow-hidden transition hover:bg-white/[0.06]">
                  <div className="relative h-32 bg-[linear-gradient(135deg,#0f172a,#065f46)] p-5 text-white">
                    {c.coverImage && (
                      <img src={c.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                    )}
                    <div className="relative">
                      <p className="text-xs font-semibold text-emerald-100">Billiard</p>
                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold">{c.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="flex items-center gap-1 p-4 text-sm text-white/50">
                      <MapPin size={14} /> {c.landmark || c.address || c.city || 'Manzil kiritilmagan'}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
                      Ko'rish <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
