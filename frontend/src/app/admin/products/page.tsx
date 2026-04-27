'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, uploadApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, StopCircle, Image, Video, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function ProductsPage() {
  const { tr } = useLang();
  const p = tr.products;
  const cm = tr.common;
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', image: '', video: '', calories: '', sortOrder: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', catFilter],
    queryFn: () => productsApi.getAll({ categoryId: catFilter || undefined, limit: 200 }).then((r) => r.data.data),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });
  const catList: any[] = (() => { const r = categories?.data?.data ?? categories?.data ?? categories; return Array.isArray(r) ? r : []; })();

  const saveMutation = useMutation({
    mutationFn: (d: any) => editItem ? productsApi.update(editItem.id, d) : productsApi.create(d),
    onSuccess: () => { toast.success(cm.save); qc.invalidateQueries({ queryKey: ['products'] }); setShowModal(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { toast.success(cm.delete); qc.invalidateQueries({ queryKey: ['products'] }); },
  });

  const stopListMutation = useMutation({
    mutationFn: ({ id, v }: any) => productsApi.toggleStopList(id, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data } = await uploadApi.uploadImage(file);
      setForm((f) => ({ ...f, image: data.data?.original ?? data.original }));
    } catch {
      toast.error(p.upload_error);
    } finally { setUploading(false); }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      const { data } = await uploadApi.uploadVideo(file);
      setForm((f) => ({ ...f, video: data.data?.url ?? data.url }));
    } catch {
      toast.error('Video yuklashda xato');
    } finally { setUploadingVideo(false); }
  };

  const openCreate = () => { setEditItem(null); setForm({ name: '', description: '', price: '', categoryId: '', image: '', video: '', calories: '', sortOrder: 0 }); setShowModal(true); };
  const openEdit = (prod: any) => { setEditItem(prod); setForm({ name: prod.name, description: prod.description || '', price: prod.price, categoryId: prod.categoryId || '', image: prod.image || '', video: prod.video || '', calories: prod.calories || '', sortOrder: prod.sortOrder || 0 }); setShowModal(true); };

  const productList: any[] = Array.isArray(products?.data) ? products.data : Array.isArray(products) ? products as any[] : [];
  const filtered = productList.filter((item: any) => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{p.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{productList.length} {p.count}</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> {p.add}</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 h-9 text-sm w-56" placeholder={cm.search} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input h-9 text-sm w-44" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">{p.all_categories}</option>
            {catList.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="table-header">{cm.name}</th>
                <th className="table-header">{p.category}</th>
                <th className="table-header">{p.price.replace(' *', '')}</th>
                <th className="table-header">{cm.status}</th>
                <th className="table-header">{cm.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">{cm.loading}</td></tr>
              ) : filtered.map((item: any) => (
                <tr key={item.id} className={`table-row ${item.isStopList ? 'opacity-50' : ''}`}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image.startsWith('http') ? item.image : `http://localhost:3000${item.image}`} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Image size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.calories && <p className="text-xs text-gray-400">{item.calories} {p.kcal}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">{catList.find((cat: any) => cat.id === item.categoryId)?.name ?? '—'}</td>
                  <td className="table-cell font-medium">{formatCurrency(item.price)}</td>
                  <td className="table-cell">
                    {item.isStopList
                      ? <span className="badge badge-danger">{p.stoplist}</span>
                      : <span className="badge badge-success">{cm.active}</span>}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => stopListMutation.mutate({ id: item.id, v: !item.isStopList })} className={`p-1.5 rounded-lg hover:bg-orange-50 ${item.isStopList ? 'text-green-500' : 'text-orange-400'}`} title={p.stoplist}>
                        <StopCircle size={15} />
                      </button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => { if (confirm(cm.confirm_delete)) deleteMutation.mutate(item.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">{cm.no_data}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg animate-slide-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editItem ? p.edit : p.create}</h2>
            <div className="space-y-3">
              <div><label className="label">{cm.name} *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">{p.description}</label><textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{p.price}</label><input className="input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><label className="label">{p.calories}</label><input className="input" type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></div>
              </div>
              <div><label className="label">{p.category}</label>
                <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">{p.select_category}</option>
                  {catList.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{p.image}</label>
                <input type="file" accept="image/*" className="input py-1.5" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
                {uploading && <p className="text-xs text-primary-500 mt-1">{p.uploading}</p>}
                {form.image && (
                  <div className="relative inline-block mt-2">
                    <img src={`http://localhost:3000${form.image}`} alt="preview" className="w-24 h-24 rounded-lg object-cover" />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, image: '' }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="label">Video (ixtiyoriy)</label>
                <input type="file" accept="video/*" className="input py-1.5" onChange={(e) => { if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]); }} />
                {uploadingVideo && <p className="text-xs text-primary-500 mt-1">Video yuklanmoqda...</p>}
                {form.video && (
                  <div className="relative inline-block mt-2">
                    <video src={`http://localhost:3000${form.video}`} className="w-40 h-24 rounded-lg object-cover" controls />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, video: '' }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
              <div><label className="label">{p.sort_order}</label><input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">{cm.cancel}</button>
              <button onClick={() => saveMutation.mutate({ ...form, price: +form.price, calories: form.calories ? +form.calories : undefined, image: form.image || undefined, video: form.video || undefined })} disabled={saveMutation.isPending} className="btn-primary flex-1">
                {saveMutation.isPending ? cm.saving : cm.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
