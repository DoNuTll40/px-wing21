import React from 'react';
import { Sparkles, Bot, ArrowRight, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function BentoQuickInsights({ 
  sellers = [], 
  products = [], 
  onOpenAiChat, 
  onOpenDashboard 
}) {
  // Rule-based live insights calculations
  const totalSent = products.reduce((acc, p) => acc + (Number(p.sent) || 0), 0);
  const totalSold = products.reduce((acc, p) => acc + (Number(p.sold) || 0), 0);
  const sellThroughRate = totalSent > 0 ? Math.round((totalSold / totalSent) * 100) : 0;

  // Best seller product today
  const topProduct = [...products]
    .filter((p) => Number(p.sold) > 0)
    .sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0))[0];

  // Highest remaining product
  const highRemainProduct = [...products]
    .filter((p) => Number(p.remain) > 0)
    .sort((a, b) => (Number(b.remain) || 0) - (Number(a.remain) || 0))[0];

  // Inactive sellers
  const inactiveSellers = sellers.filter((seller) => {
    const sProds = products.filter((p) => String(p.seller_id) === String(seller.id));
    return !sProds.some((p) => p.sent !== '' || p.sold !== '' || p.remain !== '');
  });

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none"></div>

      {/* Card Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-xl">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Smart Assistant</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h3 className="text-sm font-extrabold text-white">วิเคราะห์ข้อมูลอัจฉริยะ</h3>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
            PX AI
          </span>
        </div>

        {/* Insight Highlights Stack */}
        <div className="mt-3.5 space-y-2.5">
          {topProduct ? (
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                <Zap size={14} />
              </div>
              <div className="min-w-0 text-xs">
                <span className="text-slate-400 block text-[10px]">สินค้าขายดีอันดับ 1</span>
                <span className="font-bold text-white truncate block">
                  {topProduct.name} (ขายได้ {topProduct.sold} {topProduct.unit || 'ชิ้น'})
                </span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
              <Sparkles size={14} className="text-indigo-400 shrink-0" />
              <span>เริ่มกรอกยอดเพื่อดูบทวิเคราะห์สินค้าขายดี</span>
            </div>
          )}

          {inactiveSellers.length > 0 ? (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                <AlertTriangle size={14} />
              </div>
              <div className="min-w-0 text-xs">
                <span className="text-amber-300/80 block text-[10px]">ยังไม่ลงยอด {inactiveSellers.length} ร้าน</span>
                <span className="font-medium text-amber-200 truncate block">
                  {inactiveSellers.map((s) => s.name).slice(0, 2).join(', ')}
                  {inactiveSellers.length > 2 ? ` และอีก ${inactiveSellers.length - 2} ร้าน` : ''}
                </span>
              </div>
            </div>
          ) : sellers.length > 0 ? (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                <CheckCircle2 size={14} />
              </div>
              <div className="text-xs text-emerald-300 font-bold">
                ลงข้อมูลครบทุกผู้ฝากขายแล้ว! 🎉
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 relative z-10 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400">
          วิเคราะห์ {products.length} รายการ
        </span>

        <button
          type="button"
          onClick={onOpenDashboard}
          className="flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
        >
          <span>ดูสถิติเต็ม</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
