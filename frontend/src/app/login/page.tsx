'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UtensilsCrossed, UserPlus, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import LanguageSelector from '@/components/ui/LanguageSelector';

const ROLE_REDIRECT: Record<string, string> = {
  superadmin: '/superadmin',
  cafe_admin: '/admin',
  manager: '/manager',
  cashier: '/cashier',
  waiter: '/waiter',
  kitchen: '/kitchen',
  client: '/client',
};

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
  const { tr } = useLang();
  const a = tr.auth;
  const { staffLogin, clientLogin, isLoading } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ phone: '', password: '' });

  const [showRegister, setShowRegister] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [reg, setReg] = useState({ phone: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await staffLogin(form.phone, form.password);
      const role = (user?.role || '').toLowerCase();
      toast.success(a.welcome);
      window.location.assign(ROLE_REDIRECT[role] || '/');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || a.error);
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    try {
      await clientLogin(reg.phone);
      toast.success(a.welcome);
      window.location.assign('/client');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || a.register_error);
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
                <p className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400 shadow-inner">Ishga kirishdan oldin telefon va parolni kiriting. Agar mehmon bo‘lsangiz, telefon orqali tez ro‘yxatdan o‘ting.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tezkor</p>
                  <p className="mt-3 font-medium">Bir necha soniyada login</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Xavfsiz</p>
                  <p className="mt-3 font-medium">JWT va rollarga asoslangan kirish</p>
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
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">{a.login}</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Hisobingizga kirish</h2>
                </div>
                <div className="rounded-full bg-slate-800/70 p-3 text-slate-300 shadow-lg shadow-cyan-500/10">
                  <span className="text-sm font-semibold">v1.0</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="label text-slate-300">{a.phone}</label>
                  <input
                    className="input bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="label text-slate-300">{a.password}</label>
                  <div className="relative">
                    <input
                      className="input bg-slate-900/90 border-slate-700 pr-12 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100"
                      onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full h-12 rounded-3xl bg-gradient-to-r from-cyan-500 to-primary-600 text-base shadow-lg shadow-cyan-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {isLoading
                    ? <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : a.submit}
                </button>
              </form>

              <div className="mt-6 grid gap-3">
                <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <span className="h-px flex-1 bg-slate-700/60" />
                  <span>{a.or}</span>
                  <span className="h-px flex-1 bg-slate-700/60" /></div>
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  onClick={() => setShowRegister(true)}
                  className="btn-secondary w-full h-12 rounded-3xl border border-slate-700 bg-slate-900/80 text-slate-200 shadow-sm hover:bg-slate-800"
                >
                  <UserPlus size={18} />
                  {a.guest_btn}
                </motion.button>
              </div>
            </motion.div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">© 2024 Buyurtma24.uz · All rights reserved</p>
        </div>
      </div>

      <AnimatePresence>
        {showRegister && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/30"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{a.guest_title}</h3>
                  <p className="text-sm text-slate-400">Telefon raqamingizni kiriting</p>
                </div>
                <button onClick={() => setShowRegister(false)} className="btn-ghost btn-icon text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleClientLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="label text-slate-300">{a.phone_req}</label>
                  <input
                    className="input bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    required
                    autoFocus
                    value={reg.phone}
                    onChange={(e) => setReg({ phone: e.target.value })}
                  />
                  <p className="text-sm text-slate-500">Telefon raqamingizni kiriting, parol shart emas.</p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary flex-1 h-12 rounded-3xl text-slate-200 bg-slate-900/75 hover:bg-slate-800">
                    {tr.common.cancel}
                  </button>
                  <button type="submit" disabled={regLoading} className="btn-primary flex-1 h-12 rounded-3xl bg-gradient-to-r from-primary-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5">
                    {regLoading
                      ? <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : a.register}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
