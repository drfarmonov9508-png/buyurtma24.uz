'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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


export default function LoginPage() {
  const { tr } = useLang();
  const a = tr.auth;
  const router = useRouter();
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
      const user = await clientLogin(reg.phone);
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language selector top-right */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-200">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Buyurtma24</h1>
          <p className="text-gray-500 mt-1">{a.subtitle}</p>
        </div>

        {/* Staff Login Card */}
        <div className="card p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">{a.login}</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">{a.phone}</label>
              <input
                className="input"
                type="tel"
                placeholder="+998901234567"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{a.password}</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full h-11 text-base">
              {isLoading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                : a.submit}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{a.or}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Guest Register Button */}
          <button
            onClick={() => setShowRegister(true)}
            className="btn-secondary w-full h-11 text-base gap-2"
          >
            <UserPlus size={18} />
            {a.guest_btn}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2024 Buyurtma24.uz · All rights reserved</p>
      </div>

      {/* Client Phone Login Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{a.guest_title}</h3>
              <button onClick={() => setShowRegister(false)} className="btn-ghost btn-icon text-gray-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleClientLogin} className="space-y-4">
              <div>
                <label className="label">{a.phone_req}</label>
                <input
                  className="input text-lg h-12"
                  type="tel"
                  placeholder="+998901234567"
                  required
                  autoFocus
                  value={reg.phone}
                  onChange={(e) => setReg({ phone: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1.5">Telefon raqamingiz bilan kiring — parol shart emas</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary flex-1 h-10">
                  {tr.common.cancel}
                </button>
                <button type="submit" disabled={regLoading} className="btn-primary flex-1 h-10">
                  {regLoading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    : a.register}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
