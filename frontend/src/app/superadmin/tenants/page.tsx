'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, MoreVertical, CheckCircle, XCircle, Eye, EyeOff, Building2, Trash2 } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'cafe', label: 'Kafe' },
  { value: 'restaurant', label: 'Restoran' },
  { value: 'oshxona', label: 'Oshxona' },
  { value: 'fastfood', label: 'Fast Food' },
  { value: 'market', label: 'Market' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'dokon', label: "Do'kon" },
  { value: 'boshqa', label: 'Boshqa' },
];

export default function TenantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; login: string; password: string } | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', businessType: 'cafe', adminFirstName: '', adminLastName: '', adminPhone: '', adminPassword: '' });
  const [showAdminPw, setShowAdminPw] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => tenantsApi.create(d),
    onSuccess: (res: any) => {
      const payload = res?.data?.data ?? res?.data ?? res;
      setCreatedCredentials({
        name: payload?.tenant?.name || form.name,
        login: payload?.credentials?.login || form.adminPhone,
        password: payload?.credentials?.password || form.adminPassword,
      });
      toast.success('Tashkilot yaratildi');
      qc.invalidateQueries({ queryKey: ['tenants'] });
      setShowModal(false);
      setForm({ name: '', slug: '', businessType: 'cafe', adminFirstName: '', adminLastName: '', adminPhone: '', adminPassword: '' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: any) => tenantsApi.toggleStatus(id, status),
    onSuccess: () => { toast.success('Holat o\'zgartirildi'); qc.invalidateQueries({ queryKey: ['tenants'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => { toast.success('Tashkilot o\'chirildi'); qc.invalidateQueries({ queryKey: ['tenants'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'O\'chirishda xato'),
  });

  const handleDelete = (t: any) => {
    if (confirm(`"${t.name}" tashkilotini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) {
      deleteMutation.mutate(t.id);
    }
  };

  const allTenants: any[] = (() => { const r = data?.data?.data ?? data?.data ?? data; return Array.isArray(r) ? r : []; })();
  const filtered = allTenants.filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tashkilotlar</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total ?? 0} ta tashkilot ro'yxatga olingan</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Tashkilot qo'shish
        </button>
      </div>

      {createdCredentials && (
        <div className="card p-4 border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
          <p className="font-semibold text-green-800 dark:text-green-300">Yangi tashkilot admin login ma'lumotlari</p>
          <div className="mt-2 grid gap-2 text-sm text-green-900 dark:text-green-100">
            <div><span className="font-medium">Tashkilot:</span> {createdCredentials.name}</div>
            <div><span className="font-medium">Login:</span> {createdCredentials.login}</div>
            <div><span className="font-medium">Parol:</span> {createdCredentials.password}</div>
          </div>
          <button onClick={() => setCreatedCredentials(null)} className="mt-3 text-xs text-green-700 dark:text-green-300 underline">
            Yopish
          </button>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 h-9 text-sm" placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="table-header">Tashkilot</th>
                <th className="table-header">Turi</th>
                <th className="table-header">Slug</th>
                <th className="table-header">Holat</th>
                <th className="table-header">Ro'yxat sanasi</th>
                <th className="table-header">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Yuklanmoqda...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Natija topilmadi</td></tr>
              ) : filtered.map((t: any) => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.phone}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      <Building2 size={12} />
                      {BUSINESS_TYPES.find(bt => bt.value === t.businessType)?.label || t.businessType || 'Kafe'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500 font-mono text-sm">{t.slug}</td>
                  <td className="table-cell">
                    <span className={`badge ${t.status === 'active' ? 'badge-success' : t.status === 'suspended' || t.status === 'blocked' ? 'badge-danger' : 'badge-warning'}`}>
                      {String(t.status || '').toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500">{formatDate(t.createdAt)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      {t.status === 'active' ? (
                        <button onClick={() => toggleMutation.mutate({ id: t.id, status: 'blocked' })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Bloklash">
                          <XCircle size={16} />
                        </button>
                      ) : (
                        <button onClick={() => toggleMutation.mutate({ id: t.id, status: 'active' })} className="p-1.5 rounded-lg hover:bg-green-50 text-green-500" title="Faollashtirish">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600" title="O'chirish">
                        <Trash2 size={16} />
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
          <div className="card p-6 w-full max-w-lg animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Yangi tashkilot</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Tashkilot nomi</label><input className="input" placeholder="Masalan: Amirxon" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="label">Slug</label><input className="input" placeholder="amirxon" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })} /></div>
              </div>
              <div>
                <label className="label">Tashkilot turi</label>
                <div className="grid grid-cols-4 gap-2">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      type="button"
                      onClick={() => setForm({ ...form, businessType: bt.value })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        form.businessType === bt.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>
              <hr className="border-gray-100 dark:border-gray-800" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin ma'lumotlari</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Ism</label><input className="input" value={form.adminFirstName} onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })} /></div>
                <div><label className="label">Familiya</label><input className="input" value={form.adminLastName} onChange={(e) => setForm({ ...form, adminLastName: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Telefon raqam</label><input className="input" placeholder="+998901234567" value={form.adminPhone} onChange={(e) => setForm({ ...form, adminPhone: e.target.value })} /></div>
                <div>
                  <label className="label">Parol</label>
                  <div className="relative">
                    <input className="input pr-10" type={showAdminPw ? 'text' : 'password'} value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowAdminPw(!showAdminPw)}>
                      {showAdminPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Bekor qilish</button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary flex-1">
                {createMutation.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
