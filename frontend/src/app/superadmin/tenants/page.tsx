'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { regionsApi, tenantsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Building2, CheckCircle, Dumbbell, Eye, EyeOff, Landmark, MapPin, Plus, Search, Trash2, XCircle } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'cafe', label: 'Kafe' },
  { value: 'restaurant', label: 'Restoran' },
  { value: 'oshxona', label: 'Oshxona' },
  { value: 'fastfood', label: 'Fast Food' },
  { value: 'market', label: 'Market' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'sport', label: 'Sport' },
  { value: 'dokon', label: "Do'kon" },
  { value: 'boshqa', label: 'Boshqa' },
];

const emptyForm = {
  name: '',
  businessType: 'cafe',
  sportModule: 'billiard',
  regionId: '',
  newRegionName: '',
  city: '',
  newCityName: '',
  address: '',
  landmark: '',
  adminFirstName: '',
  adminLastName: '',
  adminPhone: '',
  adminPassword: '',
};

export default function TenantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; login: string; password: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showAdminPw, setShowAdminPw] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const { data: regionsData } = useQuery({
    queryKey: ['regions-tree'],
    queryFn: () => regionsApi.getTree().then((r) => r.data.data ?? r.data),
  });

  const regions: any[] = Array.isArray(regionsData) ? regionsData : [];
  const selectedRegion = regions.find((r) => r.id === form.regionId);
  const districts: any[] = selectedRegion?.children || [];

  const createRegion = useMutation({
    mutationFn: (d: any) => regionsApi.create(d).then((r) => r.data.data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regions-tree'] }),
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
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: any) => tenantsApi.toggleStatus(id, status),
    onSuccess: () => {
      toast.success("Holat o'zgartirildi");
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      toast.success("Tashkilot o'chirildi");
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xato"),
  });

  const allTenants: any[] = useMemo(() => {
    const r = data?.data?.data ?? data?.data ?? data;
    return Array.isArray(r) ? r : [];
  }, [data]);

  const filtered = allTenants.filter((t: any) => {
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.city?.toLowerCase().includes(q) || t.phone?.includes(search);
  });

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Tashkilot nomini kiriting');
    if (!form.regionId && !form.newRegionName.trim()) return toast.error('Viloyatni tanlang yoki yangi qo‘shing');
    if (!form.city && !form.newCityName.trim()) return toast.error('Shahar/Tumanni tanlang yoki yangi qo‘shing');
    if (!form.landmark.trim() || !form.address.trim()) return toast.error('Mo‘ljal va manzil majburiy');
    if (!form.adminFirstName || !form.adminLastName || !form.adminPhone || !form.adminPassword) return toast.error('Admin ma’lumotlarini to‘ldiring');

    try {
      let regionId = form.regionId;
      let regionName = selectedRegion?.name;
      if (!regionId) {
        const region = await createRegion.mutateAsync({ name: form.newRegionName.trim(), type: 'region' });
        regionId = region.id;
        regionName = region.name;
      }

      let city = form.city;
      if (!city) {
        const district = await createRegion.mutateAsync({ name: form.newCityName.trim(), type: 'district', parentId: regionId });
        city = district.name;
      }

      createMutation.mutate({
        name: form.name.trim(),
        businessType: form.businessType,
        sportModule: form.businessType === 'sport' ? form.sportModule : undefined,
        regionId,
        city,
        address: form.address.trim(),
        landmark: form.landmark.trim(),
        adminFirstName: form.adminFirstName.trim(),
        adminLastName: form.adminLastName.trim(),
        adminPhone: form.adminPhone.trim(),
        adminPassword: form.adminPassword,
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Hudud yaratishda xato');
    }
  };

  const handleDelete = (t: any) => {
    if (confirm(`"${t.name}" tashkilotini o'chirmoqchimisiz?`)) deleteMutation.mutate(t.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-600">Markaziy boshqaruv</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">Tashkilotlar</h1>
          <p className="mt-1 text-sm text-slate-500">{allTenants.length} ta tashkilot ro'yxatga olingan</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
          <Plus size={16} /> Tashkilot qo'shish
        </button>
      </div>

      {createdCredentials && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          <p className="font-semibold">Yangi admin login ma'lumotlari</p>
          <div className="mt-2 grid gap-1 text-sm">
            <span>Tashkilot: {createdCredentials.name}</span>
            <span>Login: {createdCredentials.login}</span>
            <span>Parol: {createdCredentials.password}</span>
          </div>
          <button onClick={() => setCreatedCredentials(null)} className="mt-3 text-xs underline">Yopish</button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input h-10 rounded-2xl pl-9 text-sm" placeholder="Nomi, hududi yoki telefoni..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="table-header">Tashkilot</th>
                <th className="table-header">Yo'nalish</th>
                <th className="table-header">Hudud</th>
                <th className="table-header">Holat</th>
                <th className="table-header">Ro'yxat sanasi</th>
                <th className="table-header">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">Yuklanmoqda...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">Natija topilmadi</td></tr>
              ) : filtered.map((t: any) => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell">
                    <p className="font-semibold text-slate-950 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.phone}</p>
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {t.businessType === 'sport' ? <Dumbbell size={12} /> : <Building2 size={12} />}
                      {BUSINESS_TYPES.find((bt) => bt.value === t.businessType)?.label || t.businessType}
                      {t.businessType === 'sport' ? ' · Billiard' : ''}
                    </span>
                  </td>
                  <td className="table-cell text-slate-500">
                    {[t.city, t.landmark || t.address].filter(Boolean).join(' · ') || '-'}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${t.status === 'active' ? 'badge-success' : t.status === 'suspended' || t.status === 'blocked' ? 'badge-danger' : 'badge-warning'}`}>
                      {String(t.status || '').toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell text-slate-500">{formatDate(t.createdAt)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      {t.status === 'active' ? (
                        <button onClick={() => toggleMutation.mutate({ id: t.id, status: 'blocked' })} className="rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title="Bloklash">
                          <XCircle size={16} />
                        </button>
                      ) : (
                        <button onClick={() => toggleMutation.mutate({ id: t.id, status: 'active' })} className="rounded-xl p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" title="Faollashtirish">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(t)} className="rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title="O'chirish">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Yangi tashkilot</h2>
                <p className="mt-1 text-sm text-slate-500">Hudud mavjud bo‘lsa tanlang, bo‘lmasa shu yerning o‘zida qo‘shing.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">Yopish</button>
            </div>

            <div className="space-y-5">
              <section className="space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tashkilot</p>
                <input className="input h-12 rounded-2xl" placeholder="Masalan: Billiard Turktul" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      type="button"
                      onClick={() => setForm({ ...form, businessType: bt.value })}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                        form.businessType === bt.value
                          ? 'border-slate-950 bg-slate-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>

                {form.businessType === 'sport' && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                    <p className="mb-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">Sport turi</p>
                    <button type="button" className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left shadow-sm dark:bg-slate-900">
                      <span className="flex items-center gap-3 font-semibold"><Dumbbell size={18} className="text-emerald-600" /> Billiard</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Tanlangan</span>
                    </button>
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hudud ma'lumotlari</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="label">Viloyat</span>
                    <select className="input h-12 rounded-2xl" value={form.regionId ? form.regionId : form.newRegionName ? '__new' : ''} onChange={(e) => setForm({ ...form, regionId: e.target.value === '__new' ? '' : e.target.value, newRegionName: e.target.value === '__new' ? form.newRegionName : '', city: '', newCityName: '' })}>
                      <option value="">Viloyat tanlang</option>
                      {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      <option value="__new">+ Yangi viloyat qo‘shish</option>
                    </select>
                  </label>
                  <label>
                    <span className="label">Shahar/Tuman</span>
                    <select className="input h-12 rounded-2xl" value={form.city ? form.city : form.newCityName ? '__new' : ''} onChange={(e) => setForm({ ...form, city: e.target.value === '__new' ? '' : e.target.value, newCityName: e.target.value === '__new' ? form.newCityName : '' })} disabled={!form.regionId && !form.newRegionName}>
                      <option value="">Shahar yoki tuman tanlang</option>
                      {districts.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                      <option value="__new">+ Yangi shahar/tuman qo‘shish</option>
                    </select>
                  </label>
                </div>
                {(!form.regionId || form.newRegionName) && (
                  <input className="input h-12 rounded-2xl" placeholder="Yangi viloyat nomi" value={form.newRegionName} onChange={(e) => setForm({ ...form, newRegionName: e.target.value, regionId: '' })} />
                )}
                {(!form.city || form.newCityName) && (form.regionId || form.newRegionName) && (
                  <input className="input h-12 rounded-2xl" placeholder="Yangi shahar/tuman nomi" value={form.newCityName} onChange={(e) => setForm({ ...form, newCityName: e.target.value, city: '' })} />
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="label">Mo'ljal</span>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input className="input h-12 rounded-2xl pl-10" placeholder="Markaziy stadion yonida" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
                    </div>
                  </label>
                  <label>
                    <span className="label">Manzil</span>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input className="input h-12 rounded-2xl pl-10" placeholder="Ko'cha va bino" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Admin ma'lumotlari</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input h-12 rounded-2xl" placeholder="Ism" value={form.adminFirstName} onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })} />
                  <input className="input h-12 rounded-2xl" placeholder="Familiya" value={form.adminLastName} onChange={(e) => setForm({ ...form, adminLastName: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input h-12 rounded-2xl" placeholder="+998901234567" value={form.adminPhone} onChange={(e) => setForm({ ...form, adminPhone: e.target.value })} />
                  <div className="relative">
                    <input className="input h-12 rounded-2xl pr-10" type={showAdminPw ? 'text' : 'password'} placeholder="Parol" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowAdminPw(!showAdminPw)}>
                      {showAdminPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setShowModal(false)} className="h-12 rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">Bekor qilish</button>
              <button onClick={handleCreate} disabled={createMutation.isPending || createRegion.isPending} className="h-12 rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
                {createMutation.isPending || createRegion.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
