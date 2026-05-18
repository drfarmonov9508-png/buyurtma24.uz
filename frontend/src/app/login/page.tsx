'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { ArrowRight, Eye, EyeOff, Phone, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

const PHONE_COOKIE = 'rememberedPhone';

export default function LoginPage() {
  const router = useRouter();
  const { clientLogin, staffLogin, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'client' | 'staff'>('staff');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remembered, setRemembered] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = Cookies.get(PHONE_COOKIE);
    if (saved) {
      setPhone(saved);
      setRemembered(saved);
    }
  }, []);

  const routeByRole = (role?: string) => {
    const map: Record<string, string> = {
      superadmin: '/superadmin',
      cafe_admin: '/admin',
      billiard_admin: '/billiard-admin',
      sport_admin: '/billiard-admin',
      manager: '/manager',
      cashier: '/cashier',
      waiter: '/waiter',
      kitchen: '/kitchen',
      client: '/client',
    };
    router.push(map[(role || '').toLowerCase()] || '/client');
  };

  const handleClientLogin = async (e?: React.FormEvent, quickPhone?: string) => {
    e?.preventDefault();
    const value = (quickPhone || phone).trim();
    if (!value) return toast.error('Telefon kiriting');
    setBusy(true);
    try {
      const user = await clientLogin(value);
      Cookies.set(PHONE_COOKIE, value, { expires: 90, sameSite: 'lax' });
      routeByRole(user.role);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Xato');
    } finally {
      setBusy(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return toast.error('Login va parol kiriting');
    setBusy(true);
    try {
      const user = await staffLogin(username.trim(), password.trim());
      routeByRole(user.role);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Xato');
    } finally {
      setBusy(false);
    }
  };

  const loading = busy || isLoading;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06080d] px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[90px]" />
      </div>

      <div className="relative w-full max-w-[380px]">
        <div className="mb-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/10 backdrop-blur-xl">
            <span className="text-lg font-black tracking-tight text-white">B24</span>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-7">
          <div className="mb-5 flex justify-center gap-1 rounded-2xl bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setMode('staff')}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                mode === 'staff' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <UserRound size={18} />
            </button>
            <button
              type="button"
              onClick={() => setMode('client')}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                mode === 'client' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Phone size={18} />
            </button>
          </div>

          {mode === 'staff' ? (
            <form onSubmit={handleStaffLogin} className="space-y-3">
              <input
                className="h-14 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-white placeholder:text-white/30 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                type="text"
                placeholder="Login"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className="relative">
                <input
                  className="h-14 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 pr-12 text-white placeholder:text-white/30 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Parol"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/30 hover:text-white/60"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <ArrowRight size={20} />
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleClientLogin} className="space-y-3">
              <input
                className="h-14 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-white placeholder:text-white/30 outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                type="tel"
                placeholder="+998 90 123 45 67"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <ArrowRight size={20} />
                )}
              </button>
              {remembered && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleClientLogin(undefined, remembered)}
                  className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] text-sm text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {remembered}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
