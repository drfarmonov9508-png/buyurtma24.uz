'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function CategoriesPage() {
  const { tr } = useLang();
  const c = tr.categories;
  const cm = tr.common;
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', nameRu: '', nameEn: '', icon: '', sortOrder: 0 });

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll().then((r) => r.data) });
  const catList: any[] = (() => { const r = data?.data?.data ?? data?.data ?? data; return Array.isArray(r) ? r : []; })();

  const saveMutation = useMutation({
    mutationFn: (d: any) => editItem ? categoriesApi.update(editItem.id, d) : categoriesApi.create(d),
    onSuccess: () => { toast.success(cm.save); qc.invalidateQueries({ queryKey: ['categories'] }); setShowModal(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { toast.success(cm.delete); qc.invalidateQueries({ queryKey: ['categories'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const openCreate = () => { setEditItem(null); setForm({ name: '', nameRu: '', nameEn: '', icon: '', sortOrder: 0 }); setShowModal(true); };
  const openEdit = (cat: any) => { setEditItem(cat); setForm({ name: cat.name, nameRu: cat.nameRu || '', nameEn: cat.nameEn || '', icon: cat.icon || '', sortOrder: cat.sortOrder || 0 }); setShowModal(true); };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{c.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{catList.length} {c.count}</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> {c.add}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="card p-8 text-center text-gray-400 col-span-full">{cm.loading}</div>}
        {catList.map((cat: any) => (
          <div key={cat.id} className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-2xl">
              {cat.icon || '🍽️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white">{cat.name}</p>
              {cat.nameRu && <p className="text-xs text-gray-400">{cat.nameRu}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(cat)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-400"><Edit2 size={15} /></button>
              <button onClick={() => { if (confirm(cm.confirm_delete_short)) deleteMutation.mutate(cat.id); }} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {!isLoading && !catList.length && (
          <div className="card p-8 text-center text-gray-400 col-span-full">{c.empty}</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editItem ? c.edit : c.create}</h2>
            <div className="space-y-3">
              <div><label className="label">{c.name_uz}</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{c.name_ru}</label><input className="input" value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} /></div>
                <div><label className="label">{c.name_en}</label><input className="input" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{c.icon}</label><input className="input" placeholder="🍕" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
                <div><label className="label">{c.order}</label><input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">{cm.cancel}</button>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="btn-primary flex-1">
                {saveMutation.isPending ? cm.saving : cm.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
