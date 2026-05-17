"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { billiardApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function TablesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setLoading(true);
    billiardApi.getTables(id).then((res) => setTables(res.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleBook = async (tableId: string) => {
    if (!user) {
      toast.error('Iltimos avval tizimga kiring');
      return;
    }
    const duration = parseInt(prompt('Davomiylik (minutlarda)', '60') || '60', 10);
    try {
      await billiardApi.bookTable(tableId, { startAt: new Date().toISOString(), durationMinutes: duration });
      toast.success('Muvaffaqiyatli buyurtma yuborildi');
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  if (loading) return <p>Yuklanmoqda...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Stollar</h2>
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
