'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Phone, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useAuthStore } from '@/store/auth.store';

const PHONE_COOKIE = 'rememberedPhone';

export default function LoginPage() {
  const router = useRouter();
  const { clientLogin, staffLogin, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'client' | 'staff'>('client');
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
    const ROLE_REDIRECT: Record<string, string> = {
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
    router.push(ROLE_REDIRECT[(role || '').toLowerCase()] || '/client');
  };

  const handleClientLogin = async (e?: React.FormEvent, quickPhone?: string) => {
    e?.preventDefault();
    const value = (quickPhone || phone).trim();
    if (!value) return toast.error('Telefon raqam kiriting');

    setBusy(true);
    try {
      const user = await clientLogin(value);
      Cookies.set(PHONE_COOKIE, value, { expires: 90, sameSite: 'lax' });
      toast.success('Xush kelibsiz');
      routeByRole(user.role);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Kirishda xato');
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
      toast.success('Xush kelibsiz');
      routeByRole(user.role);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Kirishda xato');
    } finally {
      setBusy(false);
    }
  };

  const loading = busy || isLoading;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-sm dark:bg-white dark:text-slate-950">
              B24
            </div>
            <div>
              <p className="text-sm font-semibold">Buyurtma24</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Boshqaruv platformasi</p>
            </div>
          </div>
          <LanguageSelector />
        </div>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_420px]">
          <section className="hidden lg:block">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
              <p className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Restoran, savdo va sport xizmatlari bir joyda
              </p>
              <h1 className="text-5xl font-semibold leading-tight tracking-normal">
                Tez, toza va boshqarishga tayyor platforma.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
                Xodimlar, mijozlar va administratorlar uchun yagona kirish oynasi. Mobil ilova ichida ham tabiiy ishlaydi.
              </p>
            </motion.div>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-7"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Kirish</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Hisob turini tanlab davom eting</p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              {(['client', 'staff'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    mode === item ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-500'
                  }`}
                >
                  {item === 'client' ? 'Mijoz' : 'Xodim'}
                </button>
              ))}
            </div>

            {mode === 'client' ? (
              <form onSubmit={handleClientLogin} className="space-y-4">
                <label className="block">
                  <span className="label">Telefon raqam</span>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input className="input h-12 pl-10" type="tel" placeholder="+998 90 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </label>
                <button type="submit" disabled={loading} className="btn-primary h-12 w-full rounded-2xl">
                  {loading ? 'Kirilmoqda...' : 'Davom etish'}
                </button>
                {remembered && (
                  <button type="button" disabled={loading} onClick={() => handleClientLogin(undefined, remembered)} className="btn-secondary h-12 w-full rounded-2xl">
                    {remembered} bilan kirish
                  </button>
                )}
              </form>
            ) : (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <label className="block">
                  <span className="label">Telefon yoki email</span>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input className="input h-12 pl-10" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                </label>
                <label className="block">
                  <span className="label">Parol</span>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input className="input h-12 pl-10 pr-12" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                <button type="submit" disabled={loading} className="btn-primary h-12 w-full rounded-2xl">
                  {loading ? 'Tekshirilmoqda...' : 'Kirish'}
                </button>
              </form>
            )}
          </motion.section>
        </div>
      </div>
    </main>
  );
}
