'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { menuApi, ordersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, X, Search, UtensilsCrossed, MapPin, Check, Loader2,
  ClipboardList, Receipt, Clock, ChefHat, PackageCheck
} from 'lucide-react';

interface CartItem { id: string; name: string; price: number; qty: number; image?: string; }

const CART_KEY = 'buyurtma24_cart';
const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3000';
const fileUrl = (p?: string | null) => !p ? null : p.startsWith('http') ? p : `${BACKEND}${p}`;
type PageTab = 'menu' | 'orders';

const ORDER_STATUS_MAP: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  PENDING: { label: 'Kutilmoqda', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50' },
  CONFIRMED: { label: 'Tasdiqlandi', color: 'text-blue-600', icon: Check, bg: 'bg-blue-50' },
  PREPARING: { label: 'Tayyorlanmoqda', color: 'text-orange-600', icon: ChefHat, bg: 'bg-orange-50' },
  READY: { label: 'Tayyor', color: 'text-emerald-600', icon: PackageCheck, bg: 'bg-emerald-50' },
  DELIVERED: { label: 'Yetkazildi', color: 'text-green-600', icon: Check, bg: 'bg-green-50' },
  COMPLETED: { label: 'Yakunlandi', color: 'text-gray-500', icon: Check, bg: 'bg-gray-50' },
  CANCELLED: { label: 'Bekor qilindi', color: 'text-red-500', icon: X, bg: 'bg-red-50' },
};

function getCartFromStorage(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}

export default function GuestMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantId = params.tenantId as string;
  const tableId = searchParams.get('table');
  const catBarRef = useRef<HTMLDivElement>(null);

  const [menu, setMenu] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<PageTab>('menu');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

  useEffect(() => {
    setCart(getCartFromStorage());
    menuApi.getMenu(tenantId).then((r: any) => {
      const data = r.data?.data ?? r.data;
      setMenu(data);
      setActiveCat('all');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), qty: 1, image: product.image || product.imageUrl }];
    });
    toast.success(`${product.name} savatchaga qo'shildi`, { duration: 1200, position: 'top-center' });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));
  };

  const cartInProduct = (id: string) => cart.find((i) => i.id === id);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const submitOrder = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    try {
      await ordersApi.create({
        tenantId: menu?.cafe?.id || tenantId,
        tableId: tableId || undefined,
        items: cart.map((i) => ({ productId: i.id, quantity: i.qty, price: i.price })),
        notes,
      });
      setCart([]);
      localStorage.removeItem(CART_KEY);
      setShowCart(false);
      setShowSuccess(true);
    } catch {
      toast.error("Xato yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchMyOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await ordersApi.getAll({ limit: 20 });
      const raw = res.data?.data ?? res.data;
      setMyOrders(Array.isArray(raw) ? raw : raw?.data || []);
    } catch { setMyOrders([]); }
    finally { setOrdersLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') fetchMyOrders();
  }, [activeTab, fetchMyOrders]);

  const handleRequestBill = () => {
    setBillRequested(true);
    toast.success("Hisob so'rovi yuborildi! Ofitsiant tez orada keladi.", { duration: 4000, icon: '🧾' });
  };

  const scrollCatIntoView = (id: string) => {
    setActiveCat(id);
    const el = catBarRef.current?.querySelector(`[data-cat="${id}"]`) as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const filteredProducts = (() => {
    if (!menu?.categories) return [];
    if (search) {
      const q = search.toLowerCase();
      return menu.categories.flatMap((c: any) => (c.products || []).filter((p: any) =>
        p.name?.toLowerCase().includes(q) || p.nameRu?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      ));
    }
    if (activeCat === 'all') {
      return menu.categories.flatMap((c: any) => c.products || []);
    }
    return menu.categories.find((c: any) => c.id === activeCat)?.products || [];
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-white to-amber-50">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-violet-200 animate-pulse">
          <UtensilsCrossed className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Menyu yuklanmoqda...</p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl mb-6">😕</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Menyu topilmadi</h1>
        <p className="text-gray-500 text-sm max-w-xs">Ushbu restoran mavjud emas yoki vaqtincha ishlamaydi.</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6 animate-bounce">
          <Check className="w-12 h-12 text-emerald-600" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buyurtma qabul qilindi!</h1>
        <p className="text-gray-500 mb-2">Buyurtmangiz tez orada tayyorlanadi.</p>
        {tableId && <p className="text-sm text-gray-400 mb-8">Stol № {tableId.slice(-4).toUpperCase()}</p>}
        <button
          onClick={() => setShowSuccess(false)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
        >
          Yana buyurtma berish
        </button>
      </div>
    );
  }

  const cafe = menu.cafe || {};
  const totalProducts = menu.categories?.reduce((s: number, c: any) => s + (c.products?.length ?? 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        </div>
        <div className="relative max-w-2xl mx-auto px-5 pt-8 pb-5">
          <div className="flex items-center gap-4">
            {cafe.logo ? (
              <img src={cafe.logo} alt={cafe.name} className="w-14 h-14 rounded-2xl object-cover bg-white/20 shadow-lg flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 shadow-lg">
                <UtensilsCrossed className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-tight truncate">{cafe.name || 'Menyu'}</h1>
              {cafe.address && <p className="flex items-center gap-1 text-violet-200 text-xs mt-0.5 truncate"><MapPin size={10} />{cafe.address}</p>}
            </div>
            {tableId && (
              <div className="flex-shrink-0 bg-white/20 backdrop-blur rounded-2xl px-3 py-2 text-center">
                <p className="text-[10px] text-violet-200 leading-none">STOL</p>
                <p className="text-lg font-bold leading-tight">#{tableId.slice(-4).toUpperCase()}</p>
              </div>
            )}
          </div>
        </div>
        {/* Page Tabs */}
        <div className="relative max-w-2xl mx-auto px-5 flex gap-1">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === 'menu' ? 'bg-slate-50 text-gray-900' : 'text-white/70 hover:text-white'
            }`}
          >
            <UtensilsCrossed size={15} /> Menyu
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === 'orders' ? 'bg-slate-50 text-gray-900' : 'text-white/70 hover:text-white'
            }`}
          >
            <ClipboardList size={15} /> Buyurtmalarim
          </button>
        </div>
      </div>

      {/* ===== MENU TAB ===== */}
      {activeTab === 'menu' && (
        <>
          {/* Sticky search + categories */}
          <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
            <div className="max-w-2xl mx-auto">
              <div className="px-4 pt-3 pb-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-300 transition-all"
                    placeholder="Taom qidirish..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>
                  )}
                </div>
              </div>
              {!search && (
                <div ref={catBarRef} className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
                  <button data-cat="all" onClick={() => setActiveCat('all')}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      activeCat === 'all' ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    Barchasi {activeCat === 'all' && <span className="ml-1 bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-lg">{totalProducts}</span>}
                  </button>
                  {menu.categories?.map((c: any) => (
                    <button key={c.id} data-cat={c.id} onClick={() => scrollCatIntoView(c.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                        activeCat === c.id ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {c.icon && <span className="text-base leading-none">{c.icon}</span>}
                      {c.name}
                      {activeCat === c.id && <span className="ml-0.5 bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-lg">{c.products?.length ?? 0}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="max-w-2xl mx-auto px-4 py-4">
            {search && <p className="text-xs text-gray-400 mb-3 font-medium">«{search}» bo&#39;yicha {filteredProducts.length} ta natija</p>}
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product: any) => {
                const inCart = cartInProduct(product.id);
                const isStop = product.isStopList || product.isStopListed;
                return (
                  <div key={product.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all ${isStop ? 'opacity-60' : 'hover:shadow-md active:scale-[0.98]'}`}>
                    <div className="relative cursor-pointer" onClick={() => !isStop && setSelectedProduct(product)}>
                      {product.image || product.imageUrl ? (
                        <img src={fileUrl(product.image || product.imageUrl)!} alt={product.name} className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center">
                          <UtensilsCrossed className="w-8 h-8 text-violet-300" />
                        </div>
                      )}
                      {isStop && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Stop list</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-semibold text-gray-900 text-[13px] leading-tight line-clamp-2">{product.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-bold text-violet-600 text-sm">{formatCurrency(product.price)}</p>
                        {!isStop && (
                          inCart ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(product.id, -1)} className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center"><Minus size={11} /></button>
                              <span className="text-xs font-bold text-gray-900 w-4 text-center">{inCart.qty}</span>
                              <button onClick={() => updateQty(product.id, 1)} className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center"><Plus size={11} /></button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-sm"><Plus size={14} /></button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <UtensilsCrossed className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">{search ? 'Hech narsa topilmadi' : 'Bu kategoriyada taom yo\'q'}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== ORDERS TAB ===== */}
      {activeTab === 'orders' && (
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {/* Request bill button */}
          {tableId && (
            <button
              onClick={handleRequestBill}
              disabled={billRequested}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                billRequested
                  ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 hover:shadow-xl'
              }`}
            >
              {billRequested ? <><Check size={18} /> Hisob so'rovi yuborildi</> : <><Receipt size={18} /> Hisobni so'rash</>}
            </button>
          )}

          {ordersLoading ? (
            <div className="text-center py-16"><Loader2 size={24} className="animate-spin text-violet-400 mx-auto" /><p className="text-gray-400 text-sm mt-3">Yuklanmoqda...</p></div>
          ) : myOrders.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Buyurtmalar yo'q</p>
              <p className="text-gray-400 text-xs mt-1">Buyurtma berganingizdan so'ng bu yerda ko'rinadi</p>
              <button onClick={() => setActiveTab('menu')} className="mt-4 px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium">Menyu ko'rish</button>
            </div>
          ) : (
            myOrders.map((order: any) => {
              const st = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.PENDING;
              const StatusIcon = st.icon;
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl ${st.bg} flex items-center justify-center`}>
                        <StatusIcon size={16} className={st.color} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">#{order.orderNumber}</p>
                        <p className="text-[11px] text-gray-400">{new Date(order.createdAt).toLocaleString('uz')}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                  </div>
                  {/* Order Items */}
                  <div className="px-4 py-2.5 space-y-1.5">
                    {order.items?.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.productName || item.product?.name} <span className="text-gray-400">×{item.quantity}</span></span>
                        <span className="font-medium text-gray-900">{formatCurrency((item.price || 0) * item.quantity)}</span>
                      </div>
                    ))}
                    {order.items?.length > 5 && <p className="text-xs text-gray-400">+{order.items.length - 5} ta boshqa taom</p>}
                  </div>
                  {/* Order Footer */}
                  <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Jami</span>
                    <span className="font-bold text-violet-600">{formatCurrency(order.totalAmount || order.total)}</span>
                  </div>
                </div>
              );
            })
          )}

          {myOrders.length > 0 && (
            <button onClick={fetchMyOrders} className="w-full py-2.5 text-sm text-violet-600 font-medium hover:bg-violet-50 rounded-xl transition-colors flex items-center justify-center gap-1.5">
              <Loader2 size={14} className={ordersLoading ? 'animate-spin' : ''} /> Yangilash
            </button>
          )}
        </div>
      )}

      {/* Product detail sheet */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-2xl mx-auto overflow-hidden animate-slideUp" onClick={(e) => e.stopPropagation()}>
            {selectedProduct.video ? (
              <video
                src={fileUrl(selectedProduct.video)!}
                className="w-full h-52 object-cover"
                controls
                playsInline
                poster={fileUrl(selectedProduct.image || selectedProduct.imageUrl) || undefined}
              />
            ) : selectedProduct.image || selectedProduct.imageUrl ? (
              <img src={fileUrl(selectedProduct.image || selectedProduct.imageUrl)!} alt={selectedProduct.name} className="w-full h-52 object-cover" />
            ) : (
              <div className="w-full h-36 bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center">
                <UtensilsCrossed className="w-14 h-14 text-violet-300" />
              </div>
            )}
            <div className="p-5">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedProduct.name}</h2>
              {selectedProduct.description && <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{selectedProduct.description}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {selectedProduct.calories && <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">{selectedProduct.calories} kcal</span>}
                {selectedProduct.weight && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{selectedProduct.weight}g</span>}
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-2xl font-bold text-violet-600">{formatCurrency(selectedProduct.price)}</p>
                {cartInProduct(selectedProduct.id) ? (
                  <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-2 py-1">
                    <button onClick={() => updateQty(selectedProduct.id, -1)} className="w-9 h-9 rounded-xl bg-white shadow flex items-center justify-center text-violet-600"><Minus size={16} /></button>
                    <span className="font-bold text-gray-900 w-5 text-center">{cartInProduct(selectedProduct.id)!.qty}</span>
                    <button onClick={() => updateQty(selectedProduct.id, 1)} className="w-9 h-9 rounded-xl bg-violet-600 shadow flex items-center justify-center text-white"><Plus size={16} /></button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(selectedProduct)} className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white px-5 py-2.5 rounded-2xl font-semibold shadow-lg shadow-violet-200">
                    <Plus size={18} /> Qo'shish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart sheet */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl w-full max-w-2xl mx-auto max-h-[85vh] flex flex-col animate-slideUp">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Savat</h2>
                <p className="text-xs text-gray-400">{cartCount} ta taom</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2.5">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0"><UtensilsCrossed size={14} className="text-violet-400" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</p>
                    <p className="text-violet-600 text-sm font-bold mt-0.5">{formatCurrency(item.price * item.qty)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"><Minus size={12} /></button>
                    <span className="font-bold text-gray-900 w-4 text-center text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full bg-violet-600 shadow-sm flex items-center justify-center text-white"><Plus size={12} /></button>
                  </div>
                </div>
              ))}
              <div className="pt-1">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Izoh</label>
                <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm resize-none outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100" rows={2} placeholder="Maxsus so'rovlar..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-gray-100 bg-white">
              <div className="flex justify-between font-bold text-gray-900 text-lg mb-3">
                <span>Jami</span>
                <span className="text-violet-600">{formatCurrency(total)}</span>
              </div>
              <button onClick={submitOrder} disabled={submitting}
                className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-violet-200 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <><Loader2 size={18} className="animate-spin" /> Yuborilmoqda...</> : <><ShoppingCart size={18} /> Buyurtma berish</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {!showCart && !selectedProduct && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-2xl mx-auto">
            {cartCount > 0 && activeTab === 'menu' && (
              <div className="px-4 pb-2">
                <button onClick={() => setShowCart(true)}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-violet-500 to-indigo-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-violet-300/50 font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">{cartCount}</span>
                    Savatni ko'rish
                  </span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </button>
              </div>
            )}
            {cartCount === 0 && activeTab === 'menu' && (
              <div className="h-2 bg-gradient-to-t from-slate-50" />
            )}
          </div>
        </div>
      )}

      <style>{`
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
