'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { clientApi, publicApi } from '@/lib/api';
import { Store, History, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
