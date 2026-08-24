import React from 'react';
import { Trophy, TrendingUp, Package } from 'lucide-react';

export default function BentoTopProducts({ products = [], sellers = [] }) {
  const sellerMap = {};
  sellers.forEach((s) => {
    sellerMap[String(s.id)] = s.name;
  });

  const sortedProducts = [...products]
    .filter((p) => Number(p.sold) > 0)
    .sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0))
    .slice(0, 5);

  const maxSold = sortedProducts.length > 0 ? Number(sortedProducts[0].sold) || 1 : 1;

  const medalColors = [
    'bg-amber-100 text-amber-800 border-amber-300 font-black',
    'bg-slate-200 text-slate-700 border-slate-300 font-bold',
    'bg-amber-700/10 text-amber-900 border-amber-600/30 font-bold',
    'bg-slate-100 text-slate-600 border-slate-200 font-medium',
    'bg-slate-100 text-slate-600 border-slate-200 font-medium',
  ];

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Trophy size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">5 อันดับสินค้าขายดีวันนี้</h3>
            <p className="text-[10px] text-slate-400">คำนวณจากยอดขายสดในระบบ</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5 flex-1">
        {sortedProducts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5">
            <Package size={20} className="text-slate-300" />
            <span>ยังไม่มียอดขายบันทึกเข้ามาในวันนี้</span>
          </div>
        ) : (
          sortedProducts.map((p, idx) => {
            const soldCount = Number(p.sold) || 0;
            const percentage = Math.round((soldCount / maxSold) * 100);
            const sellerName = sellerMap[String(p.seller_id)] || 'ผู้ฝาก';

            return (
              <div key={p.id} className="p-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] border shrink-0 ${medalColors[idx] || medalColors[3]}`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 truncate block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {sellerName}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-emerald-600">
                      {soldCount.toLocaleString()} {p.unit || 'ชิ้น'}
                    </span>
                  </div>
                </div>

                {/* Mini Bar */}
                <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
