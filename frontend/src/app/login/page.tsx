'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { UserPlus, X, UtensilsCrossed } from 'lucide-react';
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
  const { clientLogin, isLoading } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [remembered, setRemembered] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    const saved = Cookies.get(PHONE_COOKIE);
    if (saved) {
      setPhone(saved);
      setRemembered(saved);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
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
                  className="btn-primary w-full h-12 rounded-3xl bg-gradient-to-r from-cyan-500 to-primary-600 text-base shadow-lg shadow-cyan-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {regLoading || isLoading
                    ? <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : 'Kirish'}
                </button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                  <span className="h-px flex-1 bg-slate-700/60" />
                  <span>Yoki</span>
                  <span className="h-px flex-1 bg-slate-700/60" />
                </div>

                {remembered ? (
                  <button
                    type="button"
                    onClick={handleQuickContinue}
                    className="btn-secondary w-full h-12 rounded-3xl border border-slate-700 bg-slate-900/80 text-slate-200 shadow-sm hover:bg-slate-800"
                  >
                    {remembered} bilan davom etish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="btn-secondary w-full h-12 rounded-3xl border border-slate-700 bg-slate-900/80 text-slate-200 shadow-sm hover:bg-slate-800"
                  >
                    <UserPlus size={18} />
                    Mehmon sifatida davom etish
                  </button>
                )}
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

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="label text-slate-300">Telefon raqam</label>
                  <input
                    className="input bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-sm text-slate-500">Telefon raqamingizni kiriting, parol shart emas.</p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary flex-1 h-12 rounded-3xl text-slate-200 bg-slate-900/75 hover:bg-slate-800">
                    {tr.common.cancel}
                  </button>
                  <button type="submit" disabled={regLoading || isLoading} className="btn-primary flex-1 h-12 rounded-3xl bg-gradient-to-r from-primary-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5">
                    {regLoading || isLoading
                      ? <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : 'Davom etish'}
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
