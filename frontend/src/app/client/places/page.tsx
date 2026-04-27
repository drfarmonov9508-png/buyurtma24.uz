'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { publicApi, ratingsApi, tablesApi, menuApi, ordersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Store, Star, MapPin, ChevronLeft, UtensilsCrossed, Search, Plus, Minus,
  ShoppingCart, X, Check, ArrowRight, RefreshCw, Clock, ChefHat, PackageCheck,
  Receipt, Loader2, Package, AlertCircle
} from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3000';
const fUrl = (p?: string | null) => !p ? null : p.startsWith('http') ? p : `${BACKEND}${p}`;

const STATUS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:   { label: 'Kutilmoqda',      color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   icon: Clock },
  confirmed: { label: 'Qabul qilindi',   color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',     icon: Check },
  preparing: { label: 'Tayyorlanmoqda',  color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200', icon: ChefHat },
  ready:     { label: 'Tayyor!',          color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',icon: PackageCheck },
  delivered: { label: 'Yetkazildi',      color: 'text-green-700',   bg: 'bg-green-50 border-green-200',   icon: Check },
  completed: { label: 'Yakunlandi',      color: 'text-gray-600',    bg: 'bg-gray-100 border-gray-200',    icon: Check },
  cancelled: { label: 'Bekor qilindi',   color: 'text-red-700',     bg: 'bg-red-50 border-red-200',       icon: X },
};

type Step = 'list' | 'tables' | 'session';
type Tab  = 'menu' | 'orders';
interface CartItem { id: string; name: string; price: number; qty: number; image?: string; }

export default function ClientPlacesPage() {
  const { user } = useAuthStore();

  /* ─── Step state ─── */
  const [step, setStep]     = useState<Step>('list');
  const [tab, setTab]       = useState<Tab>('menu');

  /* ─── Tenants ─── */
  const [tenants, setTenants]   = useState<any[]>([]);
  const [ratings, setRatings]   = useState<Record<string, any>>({});
  const [loading, setLoading]   = useState(true);

  /* ─── Selected org ─── */
  const [tenant, setTenant]         = useState<any>(null);
  const [freeTables, setFreeTables] = useState<any[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [table, setTable]           = useState<any>(null);

  /* ─── Session / Menu ─── */
  const [menu, setMenu]           = useState<any>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch]       = useState('');

  /* ─── Cart ─── */
  const [cart, setCart]       = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);

  /* ─── My orders (session) ─── */
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Load tenants + ratings, then check for active session ── */
  useEffect(() => {
    publicApi.getTenants().then(async (res) => {
      const list = (() => { const r = res?.data?.data ?? res?.data; return Array.isArray(r) ? r : []; })();
      setTenants(list);
      const map: Record<string, any> = {};
      await Promise.allSettled(list.map(async (t: any) => {
        try {
          const r = await ratingsApi.getTenantRating(t.id);
          const d = r?.data?.data ?? r?.data;
          map[t.id] = { average: d?.average || 0, count: d?.count || 0 };
        } catch {}
      }));
      setRatings(map);

      /* ── Restore active session if exists ── */
      try {
        const oRes = await ordersApi.getAll({ limit: 50 });
        const raw = oRes?.data?.data?.data ?? oRes?.data?.data ?? oRes?.data;
        const allOrders: any[] = Array.isArray(raw) ? raw : [];
        const active = allOrders.filter(o =>
          o.tableId &&
          !['completed', 'cancelled'].includes(o.status) &&
          o.table && o.table.status !== 'free'
        );
        if (active.length > 0) {
          const firstOrder = active[0];
          const matchedTenant = list.find((t: any) => t.id === firstOrder.tenantId);
          const tbl = firstOrder.table;
          if (matchedTenant && tbl) {
            await startSession(matchedTenant, tbl, active);
          }
        }
      } catch {}
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  /* ── Poll order statuses ── */
  const pollOrders = useCallback(async (orders: any[]) => {
    if (!orders.length) return;
    try {
      const updated = await Promise.all(
        orders.map(o => ordersApi.getOne(o.id).then(r => r.data?.data ?? r.data).catch(() => o))
      );
      setMyOrders(updated);
    } catch {}
  }, []);

  useEffect(() => {
    return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
  }, []);

  /* ── Select tenant → load free tables ── */
  const selectTenant = async (t: any) => {
    setTenant(t);
    setTable(null);
    setStep('tables');
    setTablesLoading(true);
    try {
      const res = await tablesApi.getByTenant(t.id, 'free');
      const raw = res?.data?.data ?? res?.data;
      setFreeTables(Array.isArray(raw) ? raw : []);
    } catch { toast.error('Stollarni yuklashda xato'); }
    finally { setTablesLoading(false); }
  };

  /* ── Core: start/resume session ── */
  const startSession = async (t: any, tbl: any, existingOrders: any[] = []) => {
    setTenant(t);
    setTable(tbl);
    setMenuLoading(true);
    setStep('session');
    setCart([]);
    setMyOrders(existingOrders);
    setTab(existingOrders.length > 0 ? 'orders' : 'menu');
    try {
      const res = await menuApi.getMenu(t.slug);
      setMenu(res.data?.data ?? res.data);
      setActiveCat('all');
    } catch { toast.error('Menyu yuklanmadi'); }
    finally { setMenuLoading(false); }

    if (pollerRef.current) clearInterval(pollerRef.current);
    pollerRef.current = setInterval(() => {
      setMyOrders(prev => { pollOrders(prev); return prev; });
    }, 6000);
  };

  /* ── Open new table (from table picker) ── */
  const openTable = () => {
    if (!table || !tenant) return;
    startSession(tenant, table, []);
  };

  /* ── Cart helpers ── */
  const addToCart = (p: any) => setCart(prev => {
    const ex = prev.find(i => i.id === p.id);
    const price = Number(p.discountPrice || p.price);
    if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
    return [...prev, { id: p.id, name: p.name, price, qty: 1, image: p.image }];
  });
  const updateQty = (id: string, d: number) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  /* ── Place order ── */
  const placeOrder = async () => {
    if (!cart.length) { toast.error("Savatcha bo'sh"); return; }
    setPlacing(true);
    try {
      const res = await ordersApi.create({
        tenantId: tenant.id,
        tableId: table.id,
        clientId: user?.id,
        items: cart.map(i => ({ productId: i.id, quantity: i.qty, price: i.price })),
      });
      const order = res.data?.data ?? res.data;
      setMyOrders(prev => [order, ...prev]);
      setCart([]);
      setShowCart(false);
      setTab('orders');
      toast.success('Buyurtmangiz qabul qilindi! 🎉', { duration: 3000 });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Xato yuz berdi');
    } finally { setPlacing(false); }
  };

  /* ── Close table session ── */
  const closeTable = async () => {
    if (!confirm('Stol sessiyasini yopmoqchimisiz? Kassir to\'lovni amalga oshiradi.')) return;
    try { await tablesApi.updateStatus(table.id, 'cleaning', tenant.id); } catch {}
    if (pollerRef.current) clearInterval(pollerRef.current);
    setStep('list');
    setTenant(null);
    setTable(null);
    setMyOrders([]);
    setCart([]);
    toast.success('Stol yopildi. Kassir to\'lovni amalga oshiradi.', { duration: 4000 });
  };

  /* ── Filtered products ── */
  const allProducts = menu?.categories?.flatMap((c: any) => c.products || []) || [];
  const catProducts = activeCat === 'all'
    ? allProducts
    : menu?.categories?.find((c: any) => c.id === activeCat)?.products || [];
  const display = (activeCat === 'all' ? allProducts : catProducts)
    .filter((p: any) => !p.isStopList && (!search || p.name?.toLowerCase().includes(search.toLowerCase())));

  const pendingCount = myOrders.filter(o => o.status === 'pending').length;

  /* ════════════════════ STEP 1: Tenant list ════════════════════ */
  if (step === 'list') return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏪 Tashkilotlar</h1>
        <p className="text-gray-500 text-sm mt-0.5">Kafe, restoran, market va boshqalar</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" /> Yuklanmoqda...
        </div>
      ) : tenants.length === 0 ? (
        <div className="card p-12 text-center">
          <Store size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Hozircha tashkilotlar yo'q</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tenants.map((t: any) => {
            const r = ratings[t.id];
            return (
              <div key={t.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-700 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-200 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed size={26} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{t.name}</p>
                    {t.address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={11} />{t.address}</p>
                    )}
                    {r?.count > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} className={s <= Math.round(r.average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1 font-medium">{r.average}</span>
                        <span className="text-xs text-gray-400">({r.count})</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => selectTenant(t)}
                  className="mt-4 w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-violet-200 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Tanlash <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ════════════════════ STEP 2: Table selection ════════════════════ */
  if (step === 'tables') return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => { setStep('list'); setTenant(null); }}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 transition-colors flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{tenant?.name}</h1>
          <p className="text-sm text-gray-500">Bo'sh stol tanlang</p>
        </div>
      </div>

      {tablesLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 size={22} className="animate-spin" /> Stollar yuklanmoqda...
        </div>
      ) : freeTables.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Bo'sh stol yo'q</p>
          <p className="text-gray-400 text-sm mt-1">Barcha stollar band yoki tozalanmoqda</p>
          <button onClick={() => selectTenant(tenant)} className="mt-4 px-5 py-2 bg-violet-50 dark:bg-violet-900/30 text-violet-600 rounded-xl text-sm font-medium hover:bg-violet-100 transition-colors flex items-center gap-2 mx-auto">
            <RefreshCw size={14} /> Yangilash
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {freeTables.map(t => {
              const selected = table?.id === t.id;
              return (
                <button key={t.id} onClick={() => setTable(selected ? null : t)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    selected
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-lg shadow-violet-100'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-violet-300 hover:bg-violet-50/50'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 font-bold text-lg ${
                    selected ? 'bg-violet-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    {t.name?.replace(/[^0-9]/g, '') || t.name?.charAt(0) || '?'}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.capacity} o'rin{t.section ? ` · ${t.section}` : ''}</p>
                  {selected && (
                    <div className="mt-2 flex items-center gap-1 text-violet-600 dark:text-violet-400 text-xs font-semibold">
                      <Check size={12} /> Tanlandi
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {table && (
            <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-100 dark:border-gray-800 lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:p-0">
              <button onClick={openTable}
                className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-2xl font-bold text-base shadow-xl shadow-violet-300 hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                🪑 Stol ochish — {table.name}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  /* ════════════════════ STEP 3: Active session ════════════════════ */
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden -m-4 lg:-m-8">
      {/* ── Session header ── */}
      <div className="flex-shrink-0 bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-700 text-white px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{tenant?.name}</p>
          <p className="text-violet-200 text-xs">🪑 {table?.name} &nbsp;·&nbsp; Sessiya faol</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {myOrders.length > 0 && (
            <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Package size={11} /> {myOrders.length}
            </span>
          )}
          <button onClick={closeTable}
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
            Stol yopish
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex">
        {(['menu', 'orders'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
              tab === t ? 'text-violet-600 border-b-2 border-violet-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {t === 'menu' ? '🍽 Menyu' : '📋 Buyurtmalarim'}
            {t === 'orders' && pendingCount > 0 && (
              <span className="absolute top-2 right-[calc(50%-22px)] w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === 'menu' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {menuLoading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-gray-400">
              <Loader2 size={22} className="animate-spin" /> Menyu yuklanmoqda...
            </div>
          ) : (
            <>
              {/* Search + Categories */}
              <div className="flex-shrink-0 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
                <div className="px-4 pt-3 pb-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-300 transition-all"
                      placeholder="Taom qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
                  </div>
                </div>
                <div className="flex gap-1.5 px-4 pb-2.5 overflow-x-auto scrollbar-none">
                  <button onClick={() => setActiveCat('all')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeCat === 'all' ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
                    Barchasi
                  </button>
                  {menu?.categories?.map((c: any) => (
                    <button key={c.id} onClick={() => setActiveCat(c.id)}
                      className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeCat === c.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
                      {c.icon && <span>{c.icon}</span>}{c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products grid */}
              <div className="flex-1 overflow-y-auto p-3 pb-24">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {display.map((p: any) => {
                    const inCart = cart.find(i => i.id === p.id);
                    return (
                      <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all">
                        <div className="relative">
                          {fUrl(p.image) ? (
                            <img src={fUrl(p.image)!} alt={p.name} className="w-full h-28 object-cover" />
                          ) : (
                            <div className="w-full h-28 bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                              <UtensilsCrossed size={28} className="text-violet-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="font-semibold text-gray-900 dark:text-white text-[13px] line-clamp-2 leading-tight">{p.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-bold text-violet-600 text-sm">{formatCurrency(p.discountPrice || p.price)}</p>
                            {inCart ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => updateQty(p.id, -1)} className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs">
                                  <Minus size={10} />
                                </button>
                                <span className="w-5 text-center text-xs font-bold text-gray-900 dark:text-white">{inCart.qty}</span>
                                <button onClick={() => addToCart(p)} className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center">
                                  <Plus size={10} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(p)} className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-sm hover:bg-violet-700 transition-colors">
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {display.length === 0 && (
                  <div className="text-center py-12">
                    <UtensilsCrossed size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 text-sm">{search ? 'Hech narsa topilmadi' : 'Bu bo\'limda taom yo\'q'}</p>
                  </div>
                )}
              </div>

              {/* Cart FAB */}
              {cartCount > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                  <button onClick={() => setShowCart(true)}
                    className="flex items-center gap-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-violet-400/40 font-bold text-sm">
                    <span className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold">{cartCount}</span>
                    Savatni ko'rish
                    <span className="font-bold">{formatCurrency(cartTotal)}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── Orders tab ── */
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{myOrders.length} ta buyurtma</p>
            <button onClick={() => pollOrders(myOrders)}
              className="text-xs text-violet-600 flex items-center gap-1 hover:underline">
              <RefreshCw size={12} /> Yangilash
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center py-16">
              <Receipt size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">Hali buyurtma yo'q</p>
              <p className="text-gray-400 text-sm mt-1">Menyudan mahsulot tanlang</p>
              <button onClick={() => setTab('menu')} className="mt-4 px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold">
                Menyuga o'tish
              </button>
            </div>
          ) : myOrders.map(o => {
            const st = STATUS[o.status] || STATUS.pending;
            const Icon = st.icon;
            return (
              <div key={o.id} className={`border rounded-2xl overflow-hidden ${st.bg}`}>
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${st.color} bg-white/60`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">#{o.orderNumber}</p>
                    <p className={`text-xs font-medium ${st.color}`}>{st.label}</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm flex-shrink-0">{formatCurrency(o.total)}</p>
                </div>
                {o.items?.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {o.items.map((item: any) => (
                      <span key={item.id} className="text-xs bg-white/70 text-gray-700 px-2 py-0.5 rounded-full">
                        {item.productName} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {myOrders.length > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <span>Jami (barcha buyurtmalar):</span>
                <span className="text-violet-600 text-base">{formatCurrency(myOrders.reduce((s, o) => s + Number(o.total || 0), 0))}</span>
              </div>
              <button onClick={() => setTab('menu')}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <Plus size={15} /> Yana buyurtma qo'shish
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Cart sheet ── */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50" onClick={() => setShowCart(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-2xl mx-auto max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">Savat</h2>
                <p className="text-xs text-gray-400">{cartCount} ta mahsulot</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                  {fUrl(item.image) ? (
                    <img src={fUrl(item.image)!} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed size={14} className="text-violet-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                    <p className="text-violet-600 text-sm font-bold">{formatCurrency(item.price * item.qty)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"><Minus size={11} /></button>
                    <span className="w-5 text-center font-bold text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center"><Plus size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white mb-3">
                <span>Jami</span>
                <span className="text-violet-600">{formatCurrency(cartTotal)}</span>
              </div>
              <button onClick={placeOrder} disabled={placing}
                className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-violet-200 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {placing ? <><Loader2 size={18} className="animate-spin" /> Yuborilmoqda...</> : <><ShoppingCart size={18} /> Buyurtma berish</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
