'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, uploadApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, X } from 'lucide-react';

export default function ManagerProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', isActive: true, image: '', video: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['manager-products-all'],
    queryFn: () => productsApi.getAll({ limit: 200 }).then((r) => r.data),
  });
  const { data: categoriesData } = useQuery({
    queryKey: ['manager-categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const products: any[] = (() => { const r = productsData?.data?.data ?? productsData?.data ?? productsData; return Array.isArray(r) ? r : []; })();
  const categories: any[] = (() => { const r = categoriesData?.data ?? categoriesData; return Array.isArray(r) ? r : []; })();
  const filtered = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data } = await uploadApi.uploadImage(file);
      setForm((f) => ({ ...f, image: data.data?.original ?? data.original }));
    } catch { toast.error('Rasm yuklashda xato'); } finally { setUploading(false); }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      const { data } = await uploadApi.uploadVideo(file);
      setForm((f) => ({ ...f, video: data.data?.url ?? data.url }));
    } catch { toast.error('Video yuklashda xato'); } finally { setUploadingVideo(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', categoryId: categories[0]?.id || '', isActive: true, image: '', video: '' });
    setShowModal(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), categoryId: p.categoryId || '', isActive: p.isActive, image: p.image || '', video: p.video || '' });
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => editing
      ? productsApi.update(editing.id, data)
      : productsApi.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Yangilandi' : 'Qo\'shildi');
      qc.invalidateQueries({ queryKey: ['manager-products-all'] });
      setShowModal(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const stopListMutation = useMutation({
    mutationFn: ({ id, isStopList }: any) => productsApi.toggleStopList(id, isStopList),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager-products-all'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { toast.success('O\'chirildi'); qc.invalidateQueries({ queryKey: ['manager-products-all'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.price) { toast.error('Nom va narx kiritish shart'); return; }
    saveMutation.mutate({ name: form.name, description: form.description, price: +form.price, categoryId: form.categoryId || undefined, isActive: form.isActive, image: form.image || undefined, video: form.video || undefined });
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mahsulotlar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} ta mahsulot</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> Qo'shish
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Mahsulot qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="table-header">Mahsulot</th>
                <th className="table-header">Kategoriya</th>
                <th className="table-header">Narx</th>
                <th className="table-header">Holat</th>
                <th className="table-header">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Yuklanmoqda...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Mahsulot topilmadi</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image.startsWith('http') ? p.image : `http://localhost:3000${p.image}`} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-300 text-lg">🍽</div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{p.description}</p>}
                        {p.video && <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-500 font-medium mt-0.5">▶ Video</span>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500 text-sm">{categories.find((c) => c.id === p.categoryId)?.name || '—'}</td>
                  <td className="table-cell font-semibold text-gray-900 dark:text-white">{formatCurrency(p.price)}</td>
                  <td className="table-cell">
                    {p.isStopList ? (
                      <span className="badge badge-danger">Stop</span>
                    ) : p.isActive ? (
                      <span className="badge badge-success">Aktiv</span>
                    ) : (
                      <span className="badge badge-warning">Nofaol</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => stopListMutation.mutate({ id: p.id, isStopList: !p.isStopList })}
                        className={`p-1.5 rounded-lg transition-colors ${p.isStopList ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                        title={p.isStopList ? 'Muzlatishni olib tashlash' : 'Muzlatish'}>
                        {p.isStopList ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Tahrirlash">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => confirm(`"${p.name}"ni o'chirasizmi?`) && deleteMutation.mutate(p.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="O'chirish">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">Nomi *</label>
                <input className="input" placeholder="Masalan: Osh" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Narx (so'm) *</label>
                <input className="input" type="number" placeholder="35000" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="label">Kategoriya</label>
                <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">— Tanlash —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tavsif</label>
                <textarea className="input min-h-[72px] resize-none" placeholder="Ixtiyoriy..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Rasm</label>
                <input type="file" accept="image/*" className="input py-1.5" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                {uploading && <p className="text-xs text-indigo-500 mt-1">Yuklanmoqda...</p>}
                {form.image && (
                  <div className="relative inline-block mt-2">
                    <img src={`http://localhost:3000${form.image}`} alt="" className="w-24 h-24 rounded-lg object-cover" />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, image: '' }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={10} /></button>
                  </div>
                )}
              </div>
              <div>
                <label className="label">Video (ixtiyoriy)</label>
                <input type="file" accept="video/*" className="input py-1.5" onChange={(e) => { if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]); }} />
                {uploadingVideo && <p className="text-xs text-indigo-500 mt-1">Video yuklanmoqda...</p>}
                {form.video && (
                  <div className="relative inline-block mt-2">
                    <video src={`http://localhost:3000${form.video}`} className="w-40 h-24 rounded-lg" controls />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, video: '' }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={10} /></button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Faol</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary flex-1">
                {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
