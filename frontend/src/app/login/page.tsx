'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { UtensilsCrossed } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import LanguageSelector from '@/components/ui/LanguageSelector';

const PHONE_COOKIE = 'rememberedPhone';

const cardMotion = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
};

const floatMotion = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { tr } = useLang();
  const a = tr.auth;
  const { clientLogin, staffLogin, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'client' | 'staff'>('client');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remembered, setRemembered] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    const saved = Cookies.get(PHONE_COOKIE);
    if (saved) {
      setPhone(saved);
      setRemembered(saved);
    }
  }, []);

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Telefon raqam kerak');
      return;
    }

    setRegLoading(true);
    try {
      await clientLogin(phone.trim());
      Cookies.set(PHONE_COOKIE, phone.trim(), { expires: 90, sameSite: 'lax' });
      toast.success('Xush kelibsiz!');
      router.push('/client');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Kirishda xato');
    } finally {
      setRegLoading(false);
    }
  };

  const handleQuickContinue = async () => {
    if (!remembered) return;
    setRegLoading(true);
    try {
      await clientLogin(remembered);
      toast.success('Xush kelibsiz!');
      router.push('/client');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Kirishda xato');
    } finally {
      setRegLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Foydalanuvchi nomi va parol kerak');
      return;
    }

    setRegLoading(true);
    try {
      const user = await staffLogin(username.trim(), password.trim());
      const role = (user?.role || '').toLowerCase();
      toast.success('Xush kelibsiz!');
      const ROLE_REDIRECT: Record<string, string> = {
        superadmin: '/superadmin',
        cafe_admin: '/admin',
        manager: '/manager',
        cashier: '/cashier',
        waiter: '/waiter',
        kitchen: '/kitchen',
        client: '/client',
      };
      router.push(ROLE_REDIRECT[role] || '/');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Kirishda xato');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(248,113,56,0.2),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),_transparent_26%)]" />
      <div className="pointer-events-none absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
      <motion.div className="pointer-events-none absolute right-0 top-1/4 h-80 w-80 rounded-full bg-brand/25 blur-3xl" {...floatMotion} />
      <motion.div className="pointer-events-none absolute -bottom-16 right-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" {...floatMotion} />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(15,23,42,0.6),_rgba(15,23,42,0.9))]" />

        <div className="relative z-10 w-full max-w-5xl rounded-[40px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex justify-end mb-4">
            <LanguageSelector />
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-500/15 text-primary-200 shadow-lg shadow-primary-500/10">
                  <UtensilsCrossed className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Buyurtma24</p>
                  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Zamonaviy login</h1>
                </div>
              </div>

              <div className="space-y-4 text-slate-300">
                <p className="leading-7 text-slate-300/85">Soddalashtirilgan va tezkor kirish sahifasi — foydalanuvchilar uchun qulay, brendga mos, animatsion effektlarga ega.</p>
                <p className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400 shadow-inner">Mehmon sifatida telefon orqali, xodim sifatida foydalanuvchi nomi va parol orqali kirish imkoni bor.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mehmon</p>
                  <p className="mt-3 font-medium">Telefon orqali tez kirish</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Xodim</p>
                  <p className="mt-3 font-medium">Parol bilan kirish</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={cardMotion}
              className="rounded-[32px] border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-black/20"
            >
              <div className="flex items-center justify-between gap-3 pb-4 sm:gap-6">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">Kirish</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Hisobingizga kirish</h2>
                </div>
                <div className="rounded-full bg-slate-800/70 p-3 text-slate-300 shadow-lg shadow-cyan-500/10">
                  <span className="text-sm font-semibold">v1.0</span>
                </div>
              </div>

              <div className="mb-6 flex gap-2 rounded-2xl bg-slate-800/50 p-1">
                <button
                  type="button"
                  onClick={() => setMode('client')}
                  className={`flex-1 rounded-xl py-3 font-medium transition ${
                    mode === 'client'
                      ? 'bg-cyan-500/20 text-cyan-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mehmon
                </button>
                <button
                  type="button"
                  onClick={() => setMode('staff')}
                  className={`flex-1 rounded-xl py-3 font-medium transition ${
                    mode === 'staff'
                      ? 'bg-cyan-500/20 text-cyan-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Xodim
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === 'client' ? (
                  <motion.form
                    key="client"
                    onSubmit={handleClientLogin}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <label className="label text-slate-300">Telefon raqam</label>
                      <input
                        className="input bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading || isLoading}
                      className="btn-primary w-full h-12 rounded-3xl bg-gradient-to-r from-cyan-500 to-primary-600 text-base shadow-lg shadow-cyan-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
                    >
                      {regLoading || isLoading
                        ? <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        : 'Kirish'}
                    </button>

                    {remembered && (
                      <button
                        type="button"
                        onClick={handleQuickContinue}
                        disabled={regLoading || isLoading}
                        className="btn-secondary w-full h-12 rounded-3xl border border-slate-700 bg-slate-900/80 text-slate-200 shadow-sm hover:bg-slate-800 disabled:opacity-50"
                      >
                        {remembered} bilan tez kirish
                      </button>
                    )}
                  </motion.form>
                ) : (
                  <motion.form
                    key="staff"
                    onSubmit={handleStaffLogin}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <label className="label text-slate-300">Foydalanuvchi nomi yoki Email</label>
                      <input
                        className="input bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
                        type="text"
                        placeholder="admin@cafe.uz yoki admin"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="label text-slate-300">Parol</label>
                      <div className="relative">
                        <input
                          className="input bg-slate-900/90 border-slate-700 pr-12 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
                          type={showPw ? 'text' : 'password'}
                          placeholder="••••••••"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100"
                          onClick={() => setShowPw(!showPw)}
                        >
                          {showPw ? '🔓' : '🔒'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading || isLoading}
                      className="btn-primary w-full h-12 rounded-3xl bg-gradient-to-r from-cyan-500 to-primary-600 text-base shadow-lg shadow-cyan-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
                    >
                      {regLoading || isLoading
                        ? <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        : 'Kirish'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">© 2024 Buyurtma24.uz · All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
