'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function SettingsPage() {
  const { tr } = useLang();
  const s = tr.settings;
  const cm = tr.common;
  const [form, setForm] = useState({ name: '', phone: '', address: '', currency: 'UZS', timezone: 'Asia/Tashkent', taxPercent: 0, serviceChargePercent: 0, primaryColor: '#3b82f6' });

  const { data } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then((r: any) => r.data.data) });

  useEffect(() => { if (data) setForm((f) => ({ ...f, ...data })); }, [data]);

  const saveMutation = useMutation({
    mutationFn: (d: any) => settingsApi.update(d),
    onSuccess: () => toast.success(s.saved),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{s.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{s.subtitle}</p>
        </div>
        <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="btn-primary">
          <Save size={16} /> {saveMutation.isPending ? cm.saving : cm.save}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{s.basic_info}</h2>
          <div className="space-y-3">
            <div><label className="label">{s.cafe_name}</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">{cm.phone}</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">{s.address}</label><textarea className="input resize-none" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{s.financial}</h2>
          <div className="space-y-3">
            <div><label className="label">{s.currency}</label>
              <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="UZS">UZS (so'm)</option>
                <option value="USD">USD (dollar)</option>
                <option value="EUR">EUR (euro)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">{s.tax}</label><input className="input" type="number" min={0} max={100} value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: +e.target.value })} /></div>
              <div><label className="label">{s.service_charge}</label><input className="input" type="number" min={0} max={100} value={form.serviceChargePercent} onChange={(e) => setForm({ ...form, serviceChargePercent: +e.target.value })} /></div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{s.appearance}</h2>
          <div className="space-y-3">
            <div>
              <label className="label">{s.primary_color}</label>
              <div className="flex items-center gap-3">
                <input type="color" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
                <input className="input flex-1" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
              </div>
            </div>
            <div><label className="label">{s.timezone}</label>
              <select className="input" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
