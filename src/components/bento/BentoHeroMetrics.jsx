import React from 'react';
import { Package, ShoppingBag, TrendingUp, Users, Sparkles, Calendar, Clock } from 'lucide-react';
import { formatDateThai } from '../../utils/formatDate';

export default function BentoHeroMetrics({ 
  totalSent, 
  totalSold, 
  totalRemain, 
  totalProducts, 
  activeSellers, 
  totalSellers,
  todayDate 
}) {
  const sellThroughRate = totalSent > 0 
    ? Math.round((totalSold / totalSent) * 100) 
    : 0;

  const completionRate = totalSellers > 0 
    ? Math.round((activeSellers / totalSellers) * 100) 
    : 0;

  // SVG Radial Gauge calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(sellThroughRate, 100) / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between relative overflow-hidden group">
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/50 via-indigo-50/30 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
              <Sparkles size={12} className="text-blue-600" />
              <span>Live Summary</span>
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
              <Clock size={12} />
              <span>Real-time</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            สรุปยอดขายประจำวัน
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar size={13} className="text-blue-600" />
            <span>{formatDateThai(todayDate || new Date().toISOString(), { full: true })}</span>
          </div>
        </div>
      </div>

      {/* Main Metrics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 items-center relative z-10">
        
        {/* Radial Gauge (Sell-Through Rate) */}
        <div className="lg:col-span-4 flex items-center justify-center sm:justify-start gap-4 p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              {/* Background Circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-200"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Progress Circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-blue-600 transition-all duration-1000 ease-out"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-900 leading-none">{sellThroughRate}%</span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">ขายได้</span>
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="text-xs font-bold text-slate-800">อัตราการขายวันนี้</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {sellThroughRate >= 80 
                ? '🔥 ขายดีมาก ยอดขายสูง!' 
                : sellThroughRate >= 50 
                ? '✨ ยอดขายปานกลางกำลังดี' 
                : '📦 กำลังทยอยขายและลงยอด'}
            </p>
            <div className="text-[10px] text-blue-600 font-semibold">
              จาก {totalProducts} รายการสินค้า
            </div>
          </div>
        </div>

        {/* 3 Metric Cards Grid */}
        <div className="lg:col-span-8 grid grid-cols-3 gap-2.5 sm:gap-3">
          
          {/* ส่งรวม */}
          <div className="bg-gradient-to-b from-blue-50/60 to-white p-3 sm:p-3.5 rounded-2xl border border-blue-100/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500">ส่งรวม</span>
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Package size={14} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                {totalSent.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">ชิ้นทั้งหมด</span>
            </div>
          </div>

          {/* ขายได้รวม */}
          <div className="bg-gradient-to-b from-emerald-50/60 to-white p-3 sm:p-3.5 rounded-2xl border border-emerald-100/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500">ขายได้</span>
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <ShoppingBag size={14} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-emerald-600 tracking-tight">
                {totalSold.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">{sellThroughRate}% ของยอดส่ง</span>
            </div>
          </div>

          {/* คงเหลือรวม */}
          <div className="bg-gradient-to-b from-purple-50/60 to-white p-3 sm:p-3.5 rounded-2xl border border-purple-100/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500">คงเหลือ</span>
              <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                <TrendingUp size={14} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-purple-600 tracking-tight">
                {totalRemain.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">ชิ้นที่เหลือ</span>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Progress Bar for Sellers Completed */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs relative z-10">
        <div className="flex items-center gap-2 text-slate-600">
          <Users size={14} className="text-slate-400" />
          <span className="font-medium">
            ผู้ฝากลงยอดแล้ว: <b className="text-slate-900 font-black">{activeSellers}</b> / {totalSellers} คน
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {completionRate}%
          </span>
        </div>

        <div className="flex-1 sm:max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700" 
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
