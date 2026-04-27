'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsApi, publicApi } from '@/lib/api';
import { Star, Store, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientRatingsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverValue, setHoverValue] = useState(0);
  const [comment, setComment] = useState('');

  const { data: myRatings, isLoading } = useQuery({
    queryKey: ['my-ratings'],
    queryFn: () => ratingsApi.getMy().then((r) => r.data),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['public-tenants'],
    queryFn: () => publicApi.getTenants().then((r) => r.data),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => ratingsApi.upsert(data),
    onSuccess: () => {
      toast.success('Baho saqlandi!');
      qc.invalidateQueries({ queryKey: ['my-ratings'] });
      setShowModal(false);
      setSelectedTenant(null);
      setRatingValue(0);
      setComment('');
    },
    onError: () => toast.error('Xato yuz berdi'),
  });

  const ratings: any[] = (() => {
    const r = myRatings?.data ?? myRatings;
    return Array.isArray(r) ? r : [];
  })();

  const tenants: any[] = (() => {
    const r = tenantsData?.data ?? tenantsData;
    return Array.isArray(r) ? r : [];
  })();

  const openRateModal = (tenant: any, existing?: any) => {
    setSelectedTenant(tenant);
    setRatingValue(existing?.rating || 0);
    setComment(existing?.comment || '');
    setShowModal(true);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Star size={24} /> Baholarim
        </h1>
        <p className="text-gray-500 mt-1">Foydalangan tashkilotlarga baho bering</p>
      </div>

      {/* My existing ratings */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
      ) : ratings.length === 0 ? (
        <div className="card p-8 text-center">
          <Star size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Hali baho qo'ymagansiz</p>
          <p className="text-gray-400 text-sm mt-1">Quyidagi tashkilotlarga baho bering</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map((r: any) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <Store size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{r.tenant?.name || 'Tashkilot'}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openRateModal(r.tenant, r)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  O'zgartirish
                </button>
              </div>
              {r.comment && (
                <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                  <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                  <p>{r.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Available tenants to rate */}
      {tenants.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Baho qo'yish</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tenants.map((t: any) => {
              const existing = ratings.find((r: any) => r.tenantId === t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => openRateModal(t, existing)}
                  className="card p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center">
                      <Star size={18} className={existing ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-400'} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-gray-400">
                        {existing ? `Sizning bahongiz: ${existing.rating}/5` : 'Baho qo\'ying'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {selectedTenant.name}
            </h2>
            <p className="text-sm text-gray-400 mb-5">Baho bering</p>

            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRatingValue(s)}
                  onMouseEnter={() => setHoverValue(s)}
                  onMouseLeave={() => setHoverValue(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      s <= (hoverValue || ratingValue)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Izoh (ixtiyoriy)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowModal(false); setSelectedTenant(null); }}
                className="btn-secondary flex-1"
              >
                Bekor
              </button>
              <button
                onClick={() => upsertMutation.mutate({
                  tenantId: selectedTenant.id,
                  rating: ratingValue,
                  comment: comment || undefined,
                })}
                disabled={!ratingValue || upsertMutation.isPending}
                className="btn-primary flex-1"
              >
                {upsertMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
