'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, ordersApi } from '@/lib/api';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Eye, EyeOff, Users, UserCheck, Calendar, X, ChevronDown, ChevronUp, ShoppingBag, Receipt, Package } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const STAFF_ROLES = ['cashier', 'waiter', 'kitchen', 'manager', 'cafe_admin'];
const STAFF_ROLE_KEYS = ['cashier', 'waiter', 'kitchen', 'manager'];

type Tab = 'staff' | 'clients';

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  preparing: 'Tayyorlanmoqda',
  ready: 'Tayyor',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
};

function ClientOrdersPanel({ clientId }: { clientId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['client-orders', clientId],
    queryFn: () => ordersApi.getAll({ clientId, limit: 50 }).then((r) => {
      const raw = r.data?.data ?? r.data;
      return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    }),
    staleTime: 30_000,
  });

  const orders: any[] = data || [];
  const totalSpent = orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const completedOrders = orders.filter((o: any) => o.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="py-6 text-center text-gray-400 text-sm">Buyurtmalar yuklanmoqda...</div>
    );
  }

  if (!orders.length) {
    return (
      <div className="py-8 text-center">
        <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Bu klient hali buyurtma bermagan</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Jami buyurtma</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-green-600">{completedOrders}</p>
          <p className="text-xs text-gray-400 mt-0.5">Yakunlangan</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
          <p className="text-lg font-bold text-primary-600">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Jami sarflagan</p>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {orders.map((order: any) => (
          <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Order header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <Receipt size={14} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {order.table?.number && (
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg">
                    Stol {order.table.number}
                  </span>
                )}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {ORDER_STATUS_LABEL[order.status] || order.status}
                </span>
              </div>
            </div>

            {/* Order items */}
            <div className="px-4 py-2">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs text-gray-400 font-medium py-1.5">Mahsulot</th>
                    <th className="text-xs text-gray-400 font-medium py-1.5 text-center w-16">Miqdor</th>
                    <th className="text-xs text-gray-400 font-medium py-1.5 text-right w-28">Narx</th>
                    <th className="text-xs text-gray-400 font-medium py-1.5 text-right w-28">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item: any) => (
                    <tr key={item.id} className="border-t border-gray-50 dark:border-gray-700/50">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <Package size={11} className="text-orange-400" />
                          </div>
                          <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{item.productName}</span>
                          {item.note && <span className="text-xs text-gray-400 italic">({item.note})</span>}
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">×{item.quantity}</span>
                      </td>
                      <td className="py-2 text-right text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-2 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order footer */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
              {order.discountAmount > 0 && (
                <span className="text-xs text-green-600">Chegirma: -{formatCurrency(order.discountAmount)}</span>
              )}
              <span className="text-xs text-gray-400 ml-auto mr-3">
                {(order.items || []).reduce((s: number, i: any) => s + i.quantity, 0)} ta mahsulot
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">Jami:</span>
                <span className="text-base font-bold text-primary-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { tr } = useLang();
  const s = tr.staff;
  const cm = tr.common;
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>('staff');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'waiter' });
  const [showPw, setShowPw] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['staff-all'],
    queryFn: () => usersApi.getAll({ limit: 200 }).then((r) => {
      const raw = r.data?.data ?? r.data;
      return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    }),
  });

  const allUsers: any[] = data || [];

  const filtered = useMemo(() => {
    const isStaff = tab === 'staff';
    return allUsers.filter((u: any) => {
      const role = (u.role || '').toLowerCase();
      const roleMatch = isStaff
        ? STAFF_ROLES.includes(role)
        : role === 'client';
      if (!roleMatch) return false;
      if (dateFrom) {
        const created = new Date(u.createdAt);
        if (created < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const created = new Date(u.createdAt);
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
      return true;
    });
  }, [allUsers, tab, dateFrom, dateTo]);

  const saveMutation = useMutation({
    mutationFn: (d: any) => editItem ? usersApi.update(editItem.id, d) : usersApi.create(d),
    onSuccess: () => { toast.success(cm.save); qc.invalidateQueries({ queryKey: ['staff-all'] }); setShowModal(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { toast.success(cm.delete); qc.invalidateQueries({ queryKey: ['staff-all'] }); },
  });

  const fullName = (u: any) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.phone || '—';

  const openCreate = () => {
    setEditItem(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'waiter' });
    setShowPw(false);
    setShowModal(true);
  };
  const openEdit = (u: any) => {
    setEditItem(u);
    setForm({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', phone: u.phone || '', password: '', role: u.role });
    setShowPw(false);
    setShowModal(true);
  };

  const clearDates = () => { setDateFrom(''); setDateTo(''); };
  const hasDateFilter = dateFrom || dateTo;

  const staffCount = allUsers.filter((u: any) => STAFF_ROLES.includes((u.role || '').toLowerCase())).length;
  const clientCount = allUsers.filter((u: any) => (u.role || '').toLowerCase() === 'client').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{s.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} {tab === 'staff' ? s.count : 'klient'}
            {hasDateFilter && <span className="ml-2 text-primary-500">(filtrlangan)</span>}
          </p>
        </div>
        {tab === 'staff' && (
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> {s.add}</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'staff'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck size={15} />
          Xodimlar
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'staff' ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'}`}>
            {staffCount}
          </span>
        </button>
        <button
          onClick={() => setTab('clients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'clients'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={15} />
          Klientlar
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'clients' ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'}`}>
            {clientCount}
          </span>
        </button>
      </div>

      {/* Date filter */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label flex items-center gap-1.5"><Calendar size={13} /> Boshlanish sanasi</label>
            <input
              type="date"
              className="input w-44"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Calendar size={13} /> Tugash sanasi</label>
            <input
              type="date"
              className="input w-44"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {hasDateFilter && (
            <button onClick={clearDates} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors mb-0.5">
              <X size={15} /> Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="table-header">{tab === 'staff' ? s.title : 'Klient'}</th>
                <th className="table-header">{cm.role}</th>
                <th className="table-header">{cm.phone}</th>
                <th className="table-header">{cm.status}</th>
                <th className="table-header">{s.joined}</th>
                <th className="table-header w-10">{tab === 'staff' ? cm.actions : ''}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={tab === 'staff' ? 6 : 5} className="text-center py-12 text-gray-400">{cm.loading}</td></tr>
              )}
              {filtered.map((u: any) => {
                const isExpanded = tab === 'clients' && expandedClient === u.id;
                return (
                  <React.Fragment key={u.id}>
                    <tr
                      className={`table-row ${tab === 'clients' ? 'cursor-pointer hover:bg-primary-50/30 dark:hover:bg-primary-900/10' : ''}`}
                      onClick={() => tab === 'clients' && setExpandedClient(isExpanded ? null : u.id)}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 text-sm font-bold">
                            {getInitials(fullName(u))}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{fullName(u)}</p>
                            <p className="text-xs text-gray-400">{u.email || u.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${tab === 'clients' ? 'badge-gray' : 'badge-primary'}`}>
                          {(s.roles as any)[(u.role || '').toUpperCase()] || u.role}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500">{u.phone || '—'}</td>
                      <td className="table-cell">
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-gray'}`}>
                          {u.isActive ? cm.active : cm.inactive}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500 text-sm">{formatDate(u.createdAt)}</td>
                      {tab === 'staff' ? (
                        <td className="table-cell">
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); openEdit(u); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400"><Edit2 size={15} /></button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm(cm.confirm_delete_short)) deleteMutation.mutate(u.id); }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                            ><Trash2 size={15} /></button>
                          </div>
                        </td>
                      ) : (
                        <td className="table-cell w-10">
                          {isExpanded
                            ? <ChevronUp size={16} className="text-gray-400" />
                            : <ChevronDown size={16} className="text-gray-400" />}
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr key={`${u.id}-orders`}>
                        <td colSpan={6} className="p-0">
                          <ClientOrdersPanel clientId={u.id} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={tab === 'staff' ? 6 : 6} className="text-center py-12 text-gray-400">
                    {hasDateFilter ? 'Bu sana oraliqda ma\'lumot yo\'q' : s.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-slide-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editItem ? s.edit : s.create}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{s.first_name} <span className="text-red-500">*</span></label><input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                <div><label className="label">{s.last_name} <span className="text-red-500">*</span></label><input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{cm.email}</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div>
                  <label className="label">{cm.phone} <span className="text-red-500">*</span></label>
                  <input
                    className="input"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    placeholder="+998 XX XXX XX XX"
                  />
                </div>
              </div>
              <div>
                <label className="label">{cm.role}</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {STAFF_ROLE_KEYS.map((r) => <option key={r} value={r}>{(s.roles as any)[r.toUpperCase()] || r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{editItem ? s.new_password : s.password} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">{cm.cancel}</button>
              <button
                onClick={() => {
                  if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim() || (!editItem && !form.password.trim())) {
                    toast.error('Barcha majburiy maydonlarni to\'ldiring');
                    return;
                  }
                  const payload: any = { ...form };
                  if (editItem && !payload.password) delete payload.password;
                  if (!payload.email || !payload.email.trim()) delete payload.email;
                  saveMutation.mutate(payload);
                }}
                disabled={saveMutation.isPending}
                className="btn-primary flex-1"
              >
                {saveMutation.isPending ? cm.saving : cm.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
