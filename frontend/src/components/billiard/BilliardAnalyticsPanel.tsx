'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { billiardApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Calendar, Clock, Download, TrendingUp, User, Users } from 'lucide-react';

type Period = 'today' | 'week' | 'month' | 'year' | 'custom';
type ViewMode = 'period' | 'user' | 'table';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Bugun' },
  { value: 'week', label: '7 kun' },
  { value: 'month', label: 'Oy' },
  { value: 'year', label: 'Yil' },
  { value: 'custom', label: 'Maxsus' },
];

export default function BilliardAnalyticsPanel() {
  const [period, setPeriod] = useState<Period>('month');
  const [view, setView] = useState<ViewMode>('period');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const params = useMemo(() => ({
    period: period === 'custom' ? undefined : period,
    from: period === 'custom' && from ? new Date(from).toISOString() : undefined,
    to: period === 'custom' && to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    userId: userId || undefined,
    groupBy: view,
  }), [period, from, to, userId, view]);

  const { data, isLoading } = useQuery({
    queryKey: ['billiard-analytics', params],
    queryFn: () => billiardApi.getAnalytics(params).then((r) => r.data?.data ?? r.data),
  });

  const totals = data?.totals || {};
  const byDay = data?.byDay || [];
  const byUser = data?.byUser || [];
  const byTable = data?.byTable || [];
  const sessions = data?.sessions || [];
  const users = data?.users || [];

  const chartData = byDay.map((d: any) => ({
    name: d.date.slice(5),
    tushum: d.revenue,
    sessiya: d.sessions,
  }));

  const exportCsv = () => {
    const rows = [
      ['Mijoz', 'Telefon', 'Stol', 'Boshlanish', 'Yopilgan', 'Daqiqa', 'Stol narxi', 'Xizmat', 'Jami'],
      ...sessions.map((s: any) => [
        s.userName, s.userPhone, s.tableName,
        s.confirmedAt || s.startAt, s.closedAt,
        s.durationMinutes, s.tableTotal, s.extrasTotal, s.total,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billiard-hisobot-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Hisobotlar</h2>
          <p className="text-sm text-slate-500">Davr yoki foydalanuvchi bo'yicha tahlil</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-medium dark:border-slate-700">
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              period === p.value ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Dan</span>
            <input type="date" className="input rounded-2xl" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Gacha</span>
            <input type="date" className="input rounded-2xl" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {([
          ['period', 'Davr bo\'yicha', Calendar],
          ['user', 'Foydalanuvchi', Users],
          ['table', 'Stol', TrendingUp],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
              view === key ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
        {view === 'user' && (
          <select className="input ml-auto h-10 min-w-[180px] rounded-2xl" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Barcha foydalanuvchilar</option>
            {users.map((u: any) => (
              <option key={u.userId} value={u.userId}>{u.userName} · {u.userPhone}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400">Yuklanmoqda...</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Calendar} label="Sessiyalar" value={totals.sessions || 0} />
            <StatCard icon={Clock} label="Jami daqiqa" value={totals.minutes || 0} />
            <StatCard icon={TrendingUp} label="Jami tushum" value={formatCurrency(Number(totals.revenue || 0))} />
            <StatCard icon={User} label="Xizmat tushumi" value={formatCurrency(Number(totals.extrasRevenue || 0))} />
          </div>

          {view === 'period' && chartData.length > 0 && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="mb-4 font-semibold">Kunlik tushum</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="tushum" fill="#059669" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {view === 'user' && (
            <div className="space-y-3">
              {byUser.length === 0 ? (
                <EmptyState />
              ) : byUser.map((user: any) => (
                <div key={user.userId} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                  <button
                    onClick={() => setExpandedUser(expandedUser === user.userId ? null : user.userId)}
                    className="flex w-full flex-col gap-2 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{user.userName}</p>
                      <p className="text-sm text-slate-500">{user.userPhone}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span>{user.sessions} sessiya</span>
                      <span>{user.minutes} min</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(user.revenue)}</span>
                    </div>
                  </button>
                  {expandedUser === user.userId && (
                    <div className="border-t border-slate-100 dark:border-slate-800">
                      {(user.orders || []).map((order: any) => (
                        <SessionRow key={order.id} session={order} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {view === 'table' && (
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <div className="hidden grid-cols-5 gap-2 border-b border-slate-100 bg-slate-50 p-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 sm:grid">
                <span>Stol</span><span>Sessiya</span><span>Daqiqa</span><span className="col-span-2 text-right">Tushum</span>
              </div>
              {byTable.map((row: any) => (
                <div key={row.tableId} className="grid grid-cols-2 gap-2 border-b border-slate-50 p-4 text-sm last:border-0 dark:border-slate-900 sm:grid-cols-5">
                  <b className="col-span-2 sm:col-span-1">{row.tableName}</b>
                  <span>{row.sessions}</span>
                  <span>{row.minutes} min</span>
                  <b className="col-span-2 text-right text-emerald-600 sm:col-span-1">{formatCurrency(row.revenue)}</b>
                </div>
              ))}
              {byTable.length === 0 && <EmptyState />}
            </div>
          )}

          {view === 'period' && (
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                <h3 className="font-semibold">Barcha sessiyalar</h3>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-900">
                {sessions.length === 0 ? <EmptyState /> : sessions.map((s: any) => (
                  <SessionRow key={s.id} session={s} showUser />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SessionRow({ session, showUser }: { session: any; showUser?: boolean }) {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {showUser && <p className="text-sm font-semibold">{session.userName} · {session.userPhone}</p>}
          <p className="font-medium">{session.tableName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(session.confirmedAt || session.startAt)} → {formatDateTime(session.closedAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(session.total)}</p>
          <p className="text-xs text-slate-500">{session.durationMinutes} min · stol {formatCurrency(session.tableTotal)}</p>
        </div>
      </div>
      {session.items?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {session.items.map((item: any) => (
            <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">
              {item.name} x{item.quantity} · {formatCurrency(item.lineTotal)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <p className="py-12 text-center text-slate-400">Tanlangan davrda ma'lumot yo'q</p>;
}
