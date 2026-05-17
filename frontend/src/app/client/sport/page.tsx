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
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-emerald-600">Sport modullari</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">Sport o'yinlari</h1>
        <p className="text-sm text-slate-500">Avval sport turini tanlang, keyin hudud bo‘yicha mavjud joylarni ko‘ring.</p>
      </div>

      {!module && (
        <div className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => setModule('billiard')}
            className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <CircleDot size={26} />
            </div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Billiard</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Bo‘sh stolni tanlash, admin tasdig‘i va qo‘shimcha buyurtmalar.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
              Tanlash <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      )}

      {module === 'billiard' && (
        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                  <Dumbbell size={22} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950 dark:text-white">Billiard klublar</h2>
                  <p className="text-sm text-slate-500">{clubs.length} ta klub topildi</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block w-full">
                  <span className="label">Viloyat</span>
                  <select value={selectedRegion} onChange={(e) => changeRegion(e.target.value)} className="input h-11 w-full rounded-2xl">
                    <option value="">Barcha viloyatlar</option>
                    {regions.map((reg) => <option key={reg.id} value={reg.id}>{reg.name}</option>)}
                  </select>
                </label>
                <label className="block w-full">
                  <span className="label">Shahar/Tuman</span>
                  <select value={selectedCity} onChange={(e) => changeCity(e.target.value)} className="input h-11 w-full rounded-2xl" disabled={!selectedRegion}>
                    <option value="">Barchasi</option>
                    {districts.map((district) => <option key={district.id} value={district.name}>{district.name}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Yuklanmoqda...</div>
          ) : clubs.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white py-14 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-900">
              <Search className="mx-auto mb-3 h-9 w-9" />
              Tanlangan hududda billiard klublar topilmadi
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((c) => (
                <Link key={c.id} href={`/client/sport/${c.id}`} className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 h-28 rounded-3xl bg-[linear-gradient(135deg,#0f172a,#065f46)] p-5 text-white">
                    <p className="text-xs font-semibold text-emerald-100">Billiard</p>
                    <h3 className="mt-3 line-clamp-2 text-lg font-semibold">{c.name}</h3>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={14} /> {c.landmark || c.address || c.city || 'Manzil kiritilmagan'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
