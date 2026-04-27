'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi, ordersApi, categoriesApi, productsApi } from '@/lib/api';
import { formatCurrency, ORDER_STATUS_LABELS } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, Minus, X, ChevronLeft, Users,
  UtensilsCrossed, ShoppingCart, Send, Loader2, Search, Trash2, ArrowRight, AlertCircle
} from 'lucide-react';

type View = 'tables' | 'order' | 'new-order';

const TABLE_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  FREE: { label: 'Bo\'sh', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  free: { label: 'Bo\'sh', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  OCCUPIED: { label: 'Band', bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-400' },
  occupied: { label: 'Band', bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-400' },
  RESERVED: { label: 'Bron', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
  reserved: { label: 'Bron', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
};

export default function WaiterPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>('tables');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTable, setLoadingTable] = useState<string | null>(null);

  const { data: tables, isLoading } = useQuery({ queryKey: ['waiter-tables'], queryFn: () => tablesApi.getAll().then((r: any) => r.data), refetchInterval: 10000 });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll().then((r: any) => r.data), enabled: view === 'new-order' });
  const { data: products } = useQuery({ queryKey: ['products', selectedCategory], queryFn: () => productsApi.getAll({ categoryId: selectedCategory || undefined, isAvailable: true }).then((r: any) => r.data), enabled: view === 'new-order' });

  const extract = (d: any): any[] => { const raw = d?.data?.data ?? d?.data ?? d; return Array.isArray(raw) ? raw : []; };
  const tableList = extract(tables);
  const catList = extract(categories);
  const prodList = extract(products).filter((p: any) =>
    !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const freeCount = tableList.filter((t: any) => t.status === 'FREE' || t.status === 'free').length;
  const occupiedCount = tableList.filter((t: any) => t.status === 'OCCUPIED' || t.status === 'occupied').length;

  const handleTableClick = async (table: any) => {
    setSelectedTable(table);
    setLoadingTable(table.id);
    if (table.status === 'OCCUPIED' || table.status === 'occupied') {
      try {
        const res = await ordersApi.getTableActive(table.id);
        setActiveOrder(res.data?.data ?? res.data);
      } catch { setActiveOrder(null); }
    } else {
      setActiveOrder(null);
    }
    setLoadingTable(null);
    setView('order');
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));
  };

  const createOrderMutation = useMutation({
    mutationFn: () => ordersApi.create({
      tableId: selectedTable?.id,
      items: cart.map((i) => ({ productId: i.id, quantity: i.qty, price: i.price })),
      notes,
    }),
    onSuccess: () => {
      toast.success('Buyurtma oshxonaga yuborildi!', { icon: '✅' });
      setCart([]);
      setNotes('');
      setView('tables');
      qc.invalidateQueries({ queryKey: ['waiter-tables'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const addToExistingMutation = useMutation({
    mutationFn: () => ordersApi.addItems(activeOrder.id, { items: cart.map((i) => ({ productId: i.id, quantity: i.qty, price: i.price })) }),
    onSuccess: () => {
      toast.success('Taomlar buyurtmaga qo\'shildi!', { icon: '✅' });
      setCart([]);
      setView('tables');
      qc.invalidateQueries({ queryKey: ['waiter-tables'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  });

  const total = cart.reduce((s: number, i: any) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s: number, i: any) => s + i.qty, 0);

  /* ==================== TABLES VIEW ==================== */
  if (view === 'tables') {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        {/* Header with stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stollar</h1>
            <p className="text-sm text-gray-500 mt-0.5">Stol tanlang va buyurtma oling</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700">{freeCount} bo'sh</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-semibold text-red-700">{occupiedCount} band</span>
            </div>
          </div>
        </div>

        {/* Table Grid */}
        {isLoading ? (
          <div className="text-center py-16"><Loader2 size={24} className="animate-spin text-primary-400 mx-auto" /><p className="text-gray-400 text-sm mt-2">Yuklanmoqda...</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {tableList.map((t: any) => {
              const st = TABLE_STATUS_CONFIG[t.status] || TABLE_STATUS_CONFIG.FREE;
              const isOccupied = t.status === 'OCCUPIED' || t.status === 'occupied';
              return (
                <button
                  key={t.id}
                  onClick={() => handleTableClick(t)}
                  disabled={loadingTable === t.id}
                  className={`relative border-2 rounded-2xl p-4 text-center transition-all hover:shadow-lg active:scale-[0.96] ${st.bg}`}
                >
                  {loadingTable === t.id && (
                    <div className="absolute inset-0 bg-white/60 rounded-2xl flex items-center justify-center"><Loader2 size={20} className="animate-spin text-primary-500" /></div>
                  )}
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center font-bold text-lg ${isOccupied ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {t.name?.replace(/[^\d]/g, '') || t.name?.charAt(0)}
                  </div>
                  <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Users size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-400">{t.capacity} kishi</span>
                  </div>
                  <div className={`flex items-center justify-center gap-1 mt-2 text-[11px] font-semibold ${st.text}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {tableList.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <AlertCircle size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Stollar topilmadi</p>
          </div>
        )}
      </div>
    );
  }

  /* ==================== ORDER VIEW ==================== */
  if (view === 'order') {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('tables')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"><ChevronLeft size={18} /></button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Stol {selectedTable?.name}</h1>
            <p className="text-xs text-gray-400">{selectedTable?.capacity} kishilik</p>
          </div>
          <button onClick={() => { setCart([]); setView('new-order'); }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md shadow-primary-200 hover:shadow-lg transition-all">
            <Plus size={16} /> Yangi buyurtma
          </button>
        </div>

        {activeOrder ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <UtensilsCrossed size={14} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Buyurtma #{activeOrder.orderNumber}</p>
                  <p className="text-[11px] text-gray-400">{new Date(activeOrder.createdAt).toLocaleString('uz')}</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {ORDER_STATUS_LABELS[activeOrder.status] || activeOrder.status}
              </span>
            </div>
            <div className="px-5 py-3 divide-y divide-gray-50">
              {activeOrder.items?.map((item: any, idx: number) => (
                <div key={item.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.productName || item.product?.name}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(item.price)} × {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">Jami summa</span>
              <span className="font-bold text-xl text-primary-600">{formatCurrency(activeOrder.totalAmount)}</span>
            </div>
            {activeOrder.note && (
              <div className="px-5 py-2.5 border-t border-gray-50">
                <p className="text-xs text-gray-500 bg-amber-50 px-3 py-2 rounded-lg">📝 {activeOrder.note}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed size={28} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-900 mb-1">Stol bo'sh</p>
            <p className="text-sm text-gray-400 mb-4">Yangi buyurtma boshlash uchun tugmani bosing</p>
            <button onClick={() => { setCart([]); setView('new-order'); }}
              className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors">
              <Plus size={16} /> Buyurtma boshlash
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ==================== NEW ORDER VIEW ==================== */
  if (view === 'new-order') {
    return (
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Products Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <div className="bg-white border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 p-3 border-b border-gray-50">
              <button onClick={() => setView('order')} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"><ChevronLeft size={16} /></button>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">Stol {selectedTable?.name}</p>
                <p className="text-[11px] text-gray-400">{activeOrder ? 'Mavjud buyurtmaga qo\'shish' : 'Yangi buyurtma'}</p>
              </div>
            </div>
            <div className="p-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full pl-8 pr-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-200" placeholder="Qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-none">
              <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Barchasi</button>
              {catList.map((c: any) => (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${selectedCategory === c.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {c.icon && <span className="mr-1">{c.icon}</span>}{c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {prodList.map((p: any) => {
                const inCart = cart.find((i) => i.id === p.id);
                return (
                  <button key={p.id} onClick={() => !p.isStopListed && addToCart(p)} disabled={p.isStopListed}
                    className={`relative bg-white rounded-xl border border-gray-100 text-left p-2.5 transition-all ${p.isStopListed ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md hover:border-primary-200 active:scale-[0.97]'}`}>
                    {inCart && <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">{inCart.qty}</div>}
                    <p className="text-[13px] font-medium text-gray-900 leading-tight line-clamp-2">{p.name}</p>
                    <p className="text-primary-600 font-bold text-sm mt-1.5">{formatCurrency(p.price)}</p>
                    {p.isStopListed && <p className="text-[10px] text-red-500 font-medium mt-0.5">Stop list</p>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} className="text-primary-600" />
              <span className="font-bold text-sm text-gray-900">Savatcha</span>
              <span className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-semibold">{cartCount}</span>
            </div>
            {cart.length > 0 && <button onClick={() => setCart([])} className="text-[11px] text-red-500 hover:bg-red-50 px-2 py-0.5 rounded"><Trash2 size={10} className="inline mr-0.5" />Tozalash</button>}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {cart.length === 0 && (
              <div className="text-center py-12"><ShoppingCart size={28} className="text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">Mahsulot tanlang</p></div>
            )}
            {cart.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                <span className="text-[10px] text-gray-400 w-3">{idx+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-[11px] text-gray-400">{formatCurrency(item.price)} × {item.qty}</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500"><Minus size={9} /></button>
                  <span className="text-[11px] font-bold w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:text-green-600"><Plus size={9} /></button>
                  <button onClick={() => setCart((p) => p.filter((i) => i.id !== item.id))} className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-500 ml-0.5"><X size={9} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 space-y-2">
            <textarea className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs resize-none outline-none focus:border-primary-300" rows={2} placeholder="Izoh (ixtiyoriy)..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Jami:</span>
              <span className="font-bold text-lg text-gray-900">{formatCurrency(total)}</span>
            </div>
            {activeOrder ? (
              <button onClick={() => addToExistingMutation.mutate()} disabled={!cart.length || addToExistingMutation.isPending}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-200 disabled:opacity-40 flex items-center justify-center gap-1.5">
                {addToExistingMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Qo'shilmoqda...</> : <><ArrowRight size={14} /> Buyurtmaga qo'shish</>}
              </button>
            ) : (
              <button onClick={() => createOrderMutation.mutate()} disabled={!cart.length || createOrderMutation.isPending}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary-200 disabled:opacity-40 flex items-center justify-center gap-1.5">
                {createOrderMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Yuborilmoqda...</> : <><Send size={14} /> Oshxonaga yuborish</>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
