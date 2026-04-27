'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

const ROLES = [
  { value: 'cashier', label: 'Kassir' },
  { value: 'waiter', label: 'Ofitsiant' },
  { value: 'kitchen', label: 'Oshpaz' },
  { value: 'manager', label: 'Ish yurituvchi' },
];

const ROLE_BADGE: Record<string, string> = {
  cashier: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  waiter: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  kitchen: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  manager: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export default function ManagerStaffPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', password: '', role: 'cashier' });

  const { data, isLoading } = useQuery({
    queryKey: ['manager-staff-all'],
    queryFn: () => usersApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const staff: any[] = (() => {
    const r = data?.data?.data ?? data?.data ?? data;
    return Array.isArray(r) ? r.filter((u: any) => u.role !== 'client' && u.role !== 'cafe_admin' && u.role !== 'superadmin') : [];
  })();

  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', phone: '', password: '', role: 'cashier' });
    setShowModal(true);
  };
  const openEdit = (u: any) => {
    setEditing(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, phone: u.phone, password: '', role: u.role });
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => editing
      ? usersApi.update(editing.id, data)
      : usersApi.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Yangilandi' : 'Xodim qo\'shildi');
      qc.invalidateQueries({ queryKey: ['manager-staff-all'] });
      setShowModal(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { toast.success('O\'chirildi'); qc.invalidateQueries({ queryKey: ['manager-staff-all'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const handleSave = () => {
    if (!form.firstName.trim() || !form.phone.trim()) { toast.error('Ism va telefon shart'); return; }
    if (!editing && !form.password.trim()) { toast.error('Parol kiriting'); return; }
    const payload: any = { firstName: form.firstName, lastName: form.lastName, phone: form.phone, role: form.role };
    if (form.password) payload.password = form.password;
    saveMutation.mutate(payload);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Xodimlar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{staff.length} ta xodim</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> Xodim qo'shish
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Yuklanmoqda...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Xodim yo'q</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="table-header">Xodim</th>
                  <th className="table-header">Telefon</th>
                  <th className="table-header">Lavozim</th>
                  <th className="table-header">Holat</th>
                  <th className="table-header">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                    </td>
                    <td className="table-cell text-gray-500 font-mono text-sm">{u.phone}</td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLES.find((r) => r.value === u.role)?.label || u.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => confirm(`"${u.firstName} ${u.lastName}"ni o'chirasizmi?`) && deleteMutation.mutate(u.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editing ? 'Xodimni tahrirlash' : 'Yangi xodim'}
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ism *</label>
                  <input className="input" placeholder="Ali" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Familiya</label>
                  <input className="input" placeholder="Valiyev" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Telefon *</label>
                <input className="input" type="tel" placeholder="+998901234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Lavozim *</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{editing ? 'Yangi parol (ixtiyoriy)' : 'Parol *'}</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
