'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function ManagerCategoriesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', sortOrder: '0' });

  const { data, isLoading } = useQuery({
    queryKey: ['manager-categories-all'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const categories: any[] = (() => { const r = data?.data ?? data; return Array.isArray(r) ? r : []; })();

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', sortOrder: '0' });
    setShowModal(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '', sortOrder: String(c.sortOrder || 0) });
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => editing
      ? categoriesApi.update(editing.id, data)
      : categoriesApi.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Yangilandi' : 'Qo\'shildi');
      qc.invalidateQueries({ queryKey: ['manager-categories-all'] });
      qc.invalidateQueries({ queryKey: ['manager-categories'] });
      setShowModal(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { toast.success('O\'chirildi'); qc.invalidateQueries({ queryKey: ['manager-categories-all'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'O\'chirishda xato'),
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategoriyalar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{categories.length} ta kategoriya</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> Qo'shish
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Yuklanmoqda...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Kategoriya yo'q</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => confirm(`"${c.name}"ni o'chirasizmi?`) && deleteMutation.mutate(c.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editing ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">Nomi *</label>
                <input className="input" placeholder="Masalan: Asosiy taomlar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Tavsif</label>
                <input className="input" placeholder="Ixtiyoriy" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Tartib raqami</label>
                <input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button
                onClick={() => { if (!form.name.trim()) { toast.error('Nom kiriting'); return; } saveMutation.mutate({ name: form.name, description: form.description || undefined, sortOrder: +form.sortOrder }); }}
                disabled={saveMutation.isPending}
                className="btn-primary flex-1"
              >
                {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
