'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, productsApi, ordersApi, tablesApi, paymentsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, X, UtensilsCrossed,
  Search, Package, RotateCcw, Check, Loader2, Receipt, Grid3X3
} from 'lucide-react';

const TABLE_ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Kutilmoqda',     color: 'text-amber-700',   bg: 'bg-amber-50' },
  confirmed: { label: 'Qabul qilindi',  color: 'text-blue-700',    bg: 'bg-blue-50' },
  preparing: { label: 'Tayyorlanmoqda', color: 'text-orange-700',  bg: 'bg-orange-50' },
  ready:     { label: 'Tayyor',          color: 'text-emerald-700', bg: 'bg-emerald-50' },
  delivered: { label: 'Yetkazildi',     color: 'text-green-700',   bg: 'bg-green-50' },
};

type PageTab = 'pos' | 'tables';

export default function CashierPage() {
  const [pageTab, setPageTab] = useState<PageTab>('tables');
  const qc = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories } = useQuery({ queryKey: ['categories-pos'], queryFn: () => categoriesApi.getAll().then((r: any) => r.data) });
  const { data: products } = useQuery({ queryKey: ['products-pos', selectedCategory], queryFn: () => productsApi.getAll({ categoryId: selectedCategory || undefined, isAvailable: true }).then((r: any) => r.data) });
  const { data: tables } = useQuery({ queryKey: ['tables-pos'], queryFn: () => tablesApi.getAll().then((r: any) => r.data) });

  const extract = (d: any): any[] => { const raw = d?.data?.data ?? d?.data ?? d; return Array.isArray(raw) ? raw : []; };
  const catList = extract(categories);
  const prodList = extract(products).filter((p: any) =>
    !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const tableList = extract(tables);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);
  const change = cashReceived ? Math.max(0, +cashReceived - total) : 0;

  const QUICK_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 200000];

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const order = await ordersApi.create({
        tableId: selectedTable || undefined,
        items: cart.map((i) => ({ productId: i.id, quantity: i.qty, price: i.price })),
      });
      await paymentsApi.process(order.data?.data?.id ?? order.data?.id, { method: payMethod, amount: total });
      return order;
    },
    onSuccess: () => {
      toast.success('Buyurtma va to\'lov qabul qilindi!', { icon: '✅' });
      setCart([]);
      setShowPayModal(false);
      setCashReceived('');
      setSelectedTable('');
      qc.invalidateQueries({ queryKey: ['orders-pos'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const { data: occupiedTablesData, refetch: refetchTables } = useQuery({
    queryKey: ['cashier-tables'],
    queryFn: () => tablesApi.getAll({ status: 'occupied' }).then(r => r.data),
    refetchInterval: 10000,
  });
  const occupiedTables: any[] = (() => {
    const raw = occupiedTablesData?.data?.data ?? occupiedTablesData?.data ?? occupiedTablesData;
    return Array.isArray(raw) ? raw : [];
  })();

  const cleaningTablesQuery = useQuery({
    queryKey: ['cashier-tables-cleaning'],
    queryFn: () => tablesApi.getAll({ status: 'cleaning' }).then(r => r.data),
    refetchInterval: 10000,
  });
  const cleaningTables: any[] = (() => {
    const raw = cleaningTablesQuery.data?.data?.data ?? cleaningTablesQuery.data?.data ?? cleaningTablesQuery.data;
    return Array.isArray(raw) ? raw : [];
  })();
  const paymentTables = [...cleaningTables, ...occupiedTables];

  const { data: allOrdersData, refetch: refetchOrders } = useQuery({
    queryKey: ['cashier-active-orders'],
    queryFn: () => ordersApi.getAll({ limit: 100 }).then(r => r.data),
    refetchInterval: 10000,
  });
  const allOrders: any[] = (() => {
    const raw = allOrdersData?.data?.data ?? allOrdersData?.data ?? allOrdersData;
    return Array.isArray(raw) ? raw : [];
  })();

  const payMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const tableOrders = allOrders.filter(o =>
        o.tableId === tableId &&
        !['completed', 'cancelled'].includes(o.status)
      );
      await Promise.all(tableOrders.map(o => ordersApi.pay(o.id)));
    },
    onSuccess: () => {
      toast.success('To\'lov qabul qilindi! Stol bo\'shatildi. ✅', { duration: 3000 });
      qc.invalidateQueries({ queryKey: ['cashier-tables'] });
      qc.invalidateQueries({ queryKey: ['cashier-tables-cleaning'] });
      qc.invalidateQueries({ queryKey: ['cashier-active-orders'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'To\'lovda xato'),
  });

  if (pageTab === 'tables') {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Page tabs */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 flex gap-1 pt-2">
          <button onClick={() => setPageTab('tables')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all bg-primary-600 text-white">
            <Grid3X3 size={15} /> Stollar to'lovi
            {paymentTables.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{paymentTables.length}</span>
            )}
          </button>
          <button onClick={() => setPageTab('pos')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all text-gray-500 hover:text-gray-700 bg-gray-100">
            <Receipt size={15} /> Yangi buyurtma (POS)
          </button>
        </div>

        {/* Tables payment view */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-gray-950">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">To'lov kutayotgan stollar</h2>
                <p className="text-sm text-gray-500 mt-0.5">{paymentTables.length} ta stol · To'landi tugmasini bosing</p>
              </div>
              <button onClick={() => { refetchTables(); refetchOrders(); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                <RotateCcw size={13} /> Yangilash
              </button>
            </div>

            {paymentTables.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-16 text-center">
                <Grid3X3 size={48} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">Hozircha to'lov kutayotgan stol yo'q</p>
                <p className="text-gray-400 text-sm mt-1">Band stollar bu yerda ko'rinadi</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentTables.map((table: any) => {
                  const tableOrders = allOrders.filter(o =>
                    o.tableId === table.id && !['completed', 'cancelled'].includes(o.status)
                  );
                  const grandTotal = tableOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
                  const allItems = tableOrders.flatMap((o: any) => o.items || []);
                  const isCleaning = table.status === 'cleaning';
                  return (
                    <div key={table.id} className={`bg-white dark:bg-gray-900 rounded-2xl border-2 overflow-hidden shadow-sm transition-all hover:shadow-md ${
                      isCleaning ? 'border-amber-400' : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      {/* Table header */}
                      <div className={`px-4 py-3 flex items-center gap-3 ${isCleaning ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                          isCleaning ? 'bg-amber-500 text-white' : 'bg-primary-100 text-primary-700'
                        }`}>
                          {table.name?.replace(/[^0-9]/g, '') || table.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-white">{table.name}</p>
                          <p className={`text-xs font-medium ${
                            isCleaning ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            {isCleaning ? '⏳ To\'lov kutmoqda' : '🔴 Band'}
                            {table.capacity && <span> · {table.capacity} o'rin</span>}
                          </p>
                        </div>
                        <p className="font-bold text-primary-600 text-lg">{formatCurrency(grandTotal)}</p>
                      </div>

                      {/* Orders summary */}
                      <div className="px-4 py-3 space-y-1.5">
                        {tableOrders.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-2">Buyurtma yo'q</p>
                        ) : (
                          <>
                            {tableOrders.map((order: any) => {
                              const st = TABLE_ORDER_STATUS[order.status] || TABLE_ORDER_STATUS.pending;
                              return (
                                <div key={order.id} className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg ${st.bg}`}>
                                  <span className={`font-semibold ${st.color}`}>#{order.orderNumber} · {st.label}</span>
                                  <span className={`font-bold ${st.color}`}>{formatCurrency(order.total)}</span>
                                </div>
                              );
                            })}
                            <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800">
                              <p className="text-xs text-gray-500 mb-1.5 font-medium">Mahsulotlar:</p>
                              <div className="flex flex-wrap gap-1">
                                {allItems.slice(0, 8).map((item: any, i: number) => (
                                  <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                    {item.productName} ×{item.quantity}
                                  </span>
                                ))}
                                {allItems.length > 8 && <span className="text-xs text-gray-400">+{allItems.length - 8} ta</span>}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Pay button */}
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => payMutation.mutate(table.id)}
                          disabled={payMutation.isPending || tableOrders.length === 0}
                          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                          {payMutation.isPending
                            ? <><Loader2 size={16} className="animate-spin" /> Qayta ishlanmoqda...</>
                            : <><Check size={16} /> To'landi — {formatCurrency(grandTotal)}</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Tab navigation header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 flex gap-1 pt-2">
        <button onClick={() => setPageTab('tables')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all text-gray-500 hover:text-gray-700 bg-gray-100">
          <Grid3X3 size={15} /> Stollar to'lovi
          {paymentTables.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{paymentTables.length}</span>
          )}
        </button>
        <button onClick={() => setPageTab('pos')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all bg-primary-600 text-white">
          <Receipt size={15} /> Yangi buyurtma (POS)
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
      {/* Left Panel — Products */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Search + Categories */}
        <div className="bg-white border-b border-gray-100 flex-shrink-0">
          <div className="p-3 pb-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                placeholder="Mahsulot qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-1.5 px-3 pb-2.5 overflow-x-auto scrollbar-none">
            <button onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                !selectedCategory ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              Barchasi
            </button>
            {catList.map((c: any) => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c.id ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {c.icon && <span className="mr-1">{c.icon}</span>}{c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {prodList.map((p: any) => {
              const inCart = cart.find((i) => i.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => !p.isStopListed && addToCart(p)}
                  disabled={p.isStopListed}
                  className={`relative bg-white rounded-xl border border-gray-100 text-left transition-all overflow-hidden group ${
                    p.isStopListed ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md hover:border-primary-200 active:scale-[0.97]'
                  }`}
                >
                  {p.image || p.imageUrl ? (
                    <img src={p.image || p.imageUrl} alt={p.name} className="w-full h-20 object-cover" />
                  ) : (
                    <div className="w-full h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <UtensilsCrossed size={20} className="text-gray-300" />
                    </div>
                  )}
                  {inCart && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {inCart.qty}
                    </div>
                  )}
                  {p.isStopListed && (
                    <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">STOP</div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 leading-tight line-clamp-2">{p.name}</p>
                    <p className="text-primary-600 font-bold text-sm mt-1">{formatCurrency(p.price)}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {prodList.length === 0 && (
            <div className="text-center py-16">
              <Package size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Mahsulot topilmadi</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Cart */}
      <div className="w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
        {/* Cart Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Receipt size={15} className="text-primary-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm leading-none">Yangi buyurtma</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{itemCount} ta mahsulot</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                <RotateCcw size={11} /> Tozalash
              </button>
            )}
          </div>
          <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-300 transition-colors" value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
            <option value="">📦 Olib ketish</option>
            {tableList.filter((t: any) => t.status === 'FREE' || t.status === 'free').map((t: any) => (
              <option key={t.id} value={t.id}>🪑 {t.name} ({t.capacity} kishi)</option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {cart.length === 0 && (
            <div className="text-center py-16 text-gray-300">
              <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm text-gray-400">Mahsulot qo'shing</p>
              <p className="text-xs text-gray-300 mt-1">Chap paneldan tanlang</p>
            </div>
          )}
          {cart.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 group">
              <span className="text-[10px] text-gray-400 w-4 text-center font-medium">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{formatCurrency(item.price)} × {item.qty} = <span className="text-primary-600 font-semibold">{formatCurrency(item.price * item.qty)}</span></p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"><Minus size={11} /></button>
                <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors"><Plus size={11} /></button>
                <button onClick={() => setCart((p) => p.filter((i) => i.id !== item.id))} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors ml-0.5"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Footer */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">Jami summa:</span>
            <span className="font-bold text-2xl text-gray-900">{formatCurrency(total)}</span>
          </div>
          <button
            onClick={() => { if (!cart.length) return; setShowPayModal(true); }}
            disabled={!cart.length}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary-200 hover:shadow-xl transition-all disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <CreditCard size={16} /> To'lash
          </button>
        </div>
      </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-5 text-white text-center relative">
              <button onClick={() => setShowPayModal(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><X size={16} /></button>
              <p className="text-sm text-primary-100">To'lov summasi</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(total)}</p>
              <p className="text-xs text-primary-200 mt-1">{itemCount} ta mahsulot</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Payment Method */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setPayMethod('CASH')}
                  className={`py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all border-2 ${
                    payMethod === 'CASH' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  <Banknote size={18} /> Naqd pul
                </button>
                <button onClick={() => setPayMethod('CARD')}
                  className={`py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all border-2 ${
                    payMethod === 'CARD' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  <CreditCard size={18} /> Karta
                </button>
              </div>

              {/* Cash Input */}
              {payMethod === 'CASH' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Qabul qilingan summa</label>
                  <input
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-xl font-bold text-center outline-none focus:border-primary-400 transition-colors"
                    type="number"
                    placeholder="0"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button key={amt} onClick={() => setCashReceived(String(amt))}
                        className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>
                  {cashReceived && +cashReceived >= total && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-xs text-green-600">Qaytim</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(change)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={() => createOrderMutation.mutate()}
                disabled={createOrderMutation.isPending || (payMethod === 'CASH' && cashReceived !== '' && +cashReceived < total)}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createOrderMutation.isPending
                  ? <><Loader2 size={18} className="animate-spin" /> Qayta ishlanmoqda...</>
                  : <><Check size={18} /> Tasdiqlash</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
