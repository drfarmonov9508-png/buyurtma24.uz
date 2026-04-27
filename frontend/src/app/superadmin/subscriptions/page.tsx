'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Edit2 } from 'lucide-react';

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [form, setForm] = useState({
    name: 'basic',
    displayName: '',
    priceMonthly: '',
    priceYearly: '',
    maxUsers: 5,
    maxTables: 10,
    maxBranches: 1,
    hasInventory: false,
    hasQrMenu: true,
    hasDelivery: false,
    hasAdvancedAnalytics: false,
    hasApiAccess: false,
  });

  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: () => subscriptionsApi.getPlans().then((r) => r.data) });
  const { data: subs } = useQuery({ queryKey: ['all-subs'], queryFn: () => subscriptionsApi.getAll().then((r) => r.data) });

  const plansList: any[] = (() => { const r = plans?.data ?? plans; return Array.isArray(r) ? r : []; })();
  const subsList: any[] = (() => { const r = subs?.data?.data ?? subs?.data ?? subs; return Array.isArray(r) ? r : []; })();

  const createMutation = useMutation({
    mutationFn: (d: any) => editPlan ? subscriptionsApi.updatePlan(editPlan.id, d) : subscriptionsApi.createPlan(d),
    onSuccess: () => {
      toast.success('Saqlandi');
      qc.invalidateQueries({ queryKey: ['plans'] });
      setShowModal(false);
      setEditPlan(null);
    },
  });

  const openCreate = () => {
    setEditPlan(null);
    setForm({
      name: 'basic',
      displayName: '',
      priceMonthly: '',
      priceYearly: '',
      maxUsers: 5,
      maxTables: 10,
      maxBranches: 1,
      hasInventory: false,
      hasQrMenu: true,
      hasDelivery: false,
      hasAdvancedAnalytics: false,
      hasApiAccess: false,
    });
    setShowModal(true);
  };
  const openEdit = (p: any) => {
    setEditPlan(p);
    setForm({
      name: p.name,
      displayName: p.displayName,
      priceMonthly: String(p.priceMonthly),
      priceYearly: String(p.priceYearly),
      maxUsers: p.maxUsers,
      maxTables: p.maxTables,
      maxBranches: p.maxBranches,
      hasInventory: !!p.hasInventory,
      hasQrMenu: !!p.hasQrMenu,
      hasDelivery: !!p.hasDelivery,
      hasAdvancedAnalytics: !!p.hasAdvancedAnalytics,
      hasApiAccess: !!p.hasApiAccess,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Obuna rejalari</h1>
          <p className="text-gray-500 text-sm mt-1">Tarif rejalarini boshqarish</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Yangi reja</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plansList.map((p: any) => (
          <div key={p.id} className="card p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{p.displayName}</h3>
                <p className="text-gray-500 text-sm">{p.name}</p>
              </div>
              <button onClick={() => openEdit(p)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <Edit2 size={16} />
              </button>
            </div>
            <p className="text-3xl font-bold text-primary-600">{formatCurrency(p.priceMonthly, 'UZS')}<span className="text-sm text-gray-400 font-normal">/oy</span></p>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ {p.maxBranches} ta filial</li>
              <li>✓ {p.maxTables} ta stol</li>
              <li>✓ {p.maxUsers} ta foydalanuvchi</li>
            </ul>
            <span className={`badge self-start ${p.isActive ? 'badge-success' : 'badge-gray'}`}>{p.isActive ? 'Aktiv' : 'Nofaol'}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Aktiv obunalar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="table-header">Café</th>
                <th className="table-header">Reja</th>
                <th className="table-header">Holat</th>
                <th className="table-header">Boshlanish</th>
                <th className="table-header">Tugash</th>
              </tr>
            </thead>
            <tbody>
              {subsList.map((s: any) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell font-medium">{s.tenantId}</td>
                  <td className="table-cell">{s.plan?.name ?? '—'}</td>
                  <td className="table-cell"><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{s.status}</span></td>
                  <td className="table-cell text-gray-500">{s.startDate ? formatDate(s.startDate) : '—'}</td>
                  <td className="table-cell text-gray-500">{s.endDate ? formatDate(s.endDate) : '—'}</td>
                </tr>
              ))}
              {!subsList.length && <tr><td colSpan={5} className="text-center py-10 text-gray-400">Hali obunalar yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-slide-in">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editPlan ? 'Rejani tahrirlash' : 'Yangi reja'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Reja kodi</label>
                  <select className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}>
                    <option value="basic">basic</option>
                    <option value="standard">standard</option>
                    <option value="premium">premium</option>
                    <option value="enterprise">enterprise</option>
                  </select>
                </div>
                <div><label className="label">Ko'rinadigan nom</label><input className="input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Oylik narx</label><input className="input" type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} /></div>
                <div><label className="label">Yillik narx</label><input className="input" type="number" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Foydalanuvchilar</label><input className="input" type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: +e.target.value })} /></div>
                <div><label className="label">Stollar</label><input className="input" type="number" value={form.maxTables} onChange={(e) => setForm({ ...form, maxTables: +e.target.value })} /></div>
                <div><label className="label">Filiallar</label><input className="input" type="number" value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: +e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasInventory} onChange={(e) => setForm({ ...form, hasInventory: e.target.checked })} /> Inventory</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasQrMenu} onChange={(e) => setForm({ ...form, hasQrMenu: e.target.checked })} /> QR menyu</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasDelivery} onChange={(e) => setForm({ ...form, hasDelivery: e.target.checked })} /> Yetkazib berish</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasAdvancedAnalytics} onChange={(e) => setForm({ ...form, hasAdvancedAnalytics: e.target.checked })} /> Analitika</label>
                <label className="flex items-center gap-2 col-span-2"><input type="checkbox" checked={form.hasApiAccess} onChange={(e) => setForm({ ...form, hasApiAccess: e.target.checked })} /> API kirish</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={() => createMutation.mutate(form)} className="btn-primary flex-1">Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
