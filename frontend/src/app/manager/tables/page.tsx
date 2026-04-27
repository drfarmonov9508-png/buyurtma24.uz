'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  free:     { label: "Bo'sh", badge: 'badge-success' },
  occupied: { label: 'Band', badge: 'badge-danger' },
  reserved: { label: 'Rezerv', badge: 'badge-warning' },
  cleaning: { label: 'Tozalanmoqda', badge: 'badge-warning' },
};

export default function ManagerTablesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', capacity: '4', section: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['manager-tables-all'],
    queryFn: () => tablesApi.getAll().then((r) => r.data),
  });

  const tables: any[] = (() => { const r = data?.data ?? data; return Array.isArray(r) ? r : []; })();
  const available = tables.filter((t) => t.status === 'free').length;
  const occupied = tables.filter((t) => t.status === 'occupied').length;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', capacity: '4', section: '' });
    setShowModal(true);
  };
  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ name: t.name, capacity: String(t.capacity || 4), section: t.section || '' });
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => editing ? tablesApi.update(editing.id, data) : tablesApi.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Yangilandi' : 'Stol qo\'shildi');
      qc.invalidateQueries({ queryKey: ['manager-tables-all'] });
      setShowModal(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => tablesApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager-tables-all'] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tablesApi.delete(id),
    onSuccess: () => { toast.success('O\'chirildi'); qc.invalidateQueries({ queryKey: ['manager-tables-all'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stollar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{available} bo'sh · {occupied} band</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> Stol qo'shish
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Bo'sh", count: available, color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' },
          { label: 'Band', count: occupied, color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' },
          { label: 'Jami', count: tables.length, color: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-xl px-4 py-3 text-center ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tables grid */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Yuklanmoqda...</div>
      ) : tables.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">Stol yo'q</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tables.map((t) => {
            const st = STATUS_LABELS[t.status] || { label: t.status, badge: 'badge-warning' };
            const isAvailable = t.status === 'free';
            return (
              <div key={t.id} className={`card p-4 border-2 transition-colors ${isAvailable ? 'border-green-200 dark:border-green-800' : t.status === 'occupied' ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{t.name}</p>
                  <span className={`badge text-[10px] ${st.badge}`}>{st.label}</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{t.capacity} o'rin{t.section ? ` · ${t.section}` : ''}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => statusMutation.mutate({ id: t.id, status: isAvailable ? 'occupied' : 'free' })}
                    className={`flex-1 h-8 rounded-lg text-xs font-medium transition-colors ${isAvailable ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'}`}
                  >
                    {isAvailable ? 'Band qilish' : "Bo'shatish"}
                  </button>
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => confirm(`"${t.name}"ni o'chirasizmi?`) && deleteMutation.mutate(t.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editing ? 'Stolni tahrirlash' : 'Yangi stol'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">Stol nomi *</label>
                <input className="input" placeholder="Masalan: 1-stol" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">O'rin soni</label>
                <input className="input" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </div>
              <div>
                <label className="label">Bo'lim (ixtiyoriy)</label>
                <input className="input" placeholder="Masalan: Teras, VIP" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button
                onClick={() => { if (!form.name.trim()) { toast.error('Nom kiriting'); return; } saveMutation.mutate({ name: form.name, capacity: +form.capacity, section: form.section || undefined }); }}
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
