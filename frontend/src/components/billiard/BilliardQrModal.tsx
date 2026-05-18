'use client';

import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Download, Printer, X } from 'lucide-react';
import { getBilliardScanUrl } from '@/lib/billiard';
import { formatCurrency } from '@/lib/utils';

type Props = {
  table: any;
  onClose: () => void;
};

export default function BilliardQrModal({ table, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const url = table?.qrToken ? getBilliardScanUrl(table.qrToken) : '';

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `QR-${table?.name || 'stol'}`,
  });

  const downloadPng = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `billiard-${table?.name || 'stol'}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!table?.qrToken) {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-4 backdrop-blur-sm sm:items-center sm:justify-center" onClick={onClose}>
        <div className="panel-card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
          <p className="text-white/60">QR kod hali yaratilmagan</p>
          <button onClick={onClose} className="mt-4 h-11 w-full rounded-2xl bg-white/10 text-white">Yopish</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-4 backdrop-blur-sm sm:items-center sm:justify-center" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-amber-500/20 bg-[#141210] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="font-semibold text-white">{table.name}</p>
            <p className="text-xs text-white/40">QR · skaner qilib band qilish</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white/5 p-2 text-white/60"><X size={18} /></button>
        </div>

        <div ref={printRef} className="flex flex-col items-center gap-4 bg-white px-6 py-8 print:p-12">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Billiard</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{table.name}</h2>
            {table.type?.name && <p className="text-sm text-slate-500">{table.type.name}</p>}
            <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(Number(table.pricePerHour))}/soat</p>
          </div>
          <div ref={canvasRef} className="rounded-2xl bg-white p-4 shadow-inner ring-1 ring-slate-100">
            <QRCodeCanvas value={url} size={220} level="H" includeMargin />
          </div>
          <p className="max-w-[260px] break-all text-center text-[10px] text-slate-400">{url}</p>
          <p className="text-center text-xs text-slate-500">Telefoningizdan skaner qiling va raqamingizni kiriting</p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4">
          <button onClick={downloadPng} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/5 text-sm font-semibold text-white hover:bg-white/10">
            <Download size={16} /> PNG
          </button>
          <button onClick={() => handlePrint()} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-500 text-sm font-semibold text-[#0c0a09]">
            <Printer size={16} /> Chop etish
          </button>
        </div>
      </div>
    </div>
  );
}
