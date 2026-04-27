'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi } from '@/lib/api';
import { cn, TABLE_STATUS_COLORS } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLang } from '@/lib/i18n';

export default function TablesPage() {
  const { tr } = useLang();
  const t = tr.tables;
  const cm = tr.common;
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [qrTable, setQrTable] = useState<any>(null);
  const [form, setForm] = useState({ name: '', capacity: 2, zone: '', floor: 1 });

  const { data, isLoading } = useQuery({ queryKey: ['tables'], queryFn: () => tablesApi.getAll().then((r) => r.data) });
  const tableList: any[] = (() => { const r = data?.data?.data ?? data?.data ?? data; return Array.isArray(r) ? r : []; })();

  const saveMutation = useMutation({
    mutationFn: (d: any) => editItem ? tablesApi.update(editItem.id, d) : tablesApi.create(d),
    onSuccess: () => { toast.success(cm.save); qc.invalidateQueries({ queryKey: ['tables'] }); setShowModal(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tablesApi.delete(id),
    onSuccess: () => { toast.success(cm.delete); qc.invalidateQueries({ queryKey: ['tables'] }); },
  });

  const openCreate = () => { setEditItem(null); setForm({ name: '', capacity: 2, zone: '', floor: 1 }); setShowModal(true); };
  const openEdit = (row: any) => { setEditItem(row); setForm({ name: row.name, capacity: row.capacity, zone: row.zone || '', floor: row.floor || 1 }); setShowModal(true); };

  const menuUrl = (row: any) => `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/menu/${row.tenantId}?table=${row.id}`;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{tableList.length} {t.count}</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> {t.add}</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading && <div className="col-span-full text-center py-12 text-gray-400">{cm.loading}</div>}
        {tableList.map((row: any) => (
          <div key={row.id} className="card p-4 flex flex-col items-center gap-3 text-center">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg', TABLE_STATUS_COLORS[row.status])}>
              {row.name}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.name}</p>
              <p className="text-xs text-gray-400">{row.capacity} {t.persons}</p>
              {row.zone && <p className="text-xs text-gray-400">{row.zone}</p>}
              <span className={`badge mt-1 ${row.status === 'FREE' ? 'badge-success' : row.status === 'OCCUPIED' ? 'badge-danger' : 'badge-warning'}`}>
                {(t.status as any)[row.status] ?? row.status}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setQrTable(row)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500" title={t.qr_title}><QrCode size={14} /></button>
              <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400"><Edit2 size={14} /></button>
              <button onClick={() => { if (confirm(cm.confirm_delete_short)) deleteMutation.mutate(row.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {!isLoading && !tableList.length && (
          <div className="col-span-full text-center py-12 text-gray-400">{cm.no_data}</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editItem ? t.edit : t.create}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{t.table_name}</label><input className="input" placeholder="A1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="label">{t.capacity}</label><input className="input" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: +e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{t.zone}</label><input className="input" placeholder="VIP, Terrace..." value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} /></div>
                <div><label className="label">{t.floor}</label><input className="input" type="number" min={1} value={form.floor} onChange={(e) => setForm({ ...form, floor: +e.target.value })} /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">{cm.cancel}</button>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="btn-primary flex-1">{saveMutation.isPending ? cm.saving : cm.save}</button>
            </div>
          </div>
        </div>
      )}

      {qrTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-8 flex flex-col items-center gap-4 animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{qrTable.name} — {t.qr_title}</h2>
            <QRCodeSVG value={menuUrl(qrTable)} size={200} />
            <p className="text-xs text-gray-400 text-center max-w-xs break-all">{menuUrl(qrTable)}</p>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="btn-primary">{cm.print}</button>
              <button onClick={() => setQrTable(null)} className="btn-secondary">{cm.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
