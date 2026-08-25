import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  ArrowLeft,
  RefreshCw,
  Trophy,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Info,
  Loader2,
  Check,
  BarChart2,
  List,
  Share2
} from 'lucide-react';
import { getDashboardAnalytics } from '../services/dashboardService';
import { formatDateThai } from '../utils/formatDate';
import AIInsightCard from './AIInsightCard';
import ShareSellerModal from './ShareSellerModal';

export default function Dashboard({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [openSellers, setOpenSellers] = useState({ default_first: true });
  const [trendViewMode, setTrendViewMode] = useState('chart'); // 'chart' | 'list'
  const [toastMessage, setToastMessage] = useState('');
  const [activeTooltipDate, setActiveTooltipDate] = useState(null);
  const [sharingSeller, setSharingSeller] = useState(null);

  const dashboardCaptureRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardAnalytics();
      setData(res);
      const now = new Date();
      setLastUpdated(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Dashboard - PX Daily Report';
    loadData();
  }, []);

  const toggleSeller = (sellerId) => {
    setOpenSellers((prev) => {
      const isCurrentlyOpen = prev[sellerId] !== undefined
        ? prev[sellerId]
        : (prev.default_first && sellerStats[0]?.seller_id === sellerId);
      return {
        ...prev,
        default_first: false,
        [sellerId]: !isCurrentlyOpen
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdf7] flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <Loader2 size={32} className="animate-spin text-amber-500 mx-auto" />
          <p className="text-xs font-bold text-amber-800">กำลังประมวลผลข้อมูล Dashboard Real-time...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalSent: 0,
    totalSold: 0,
    totalRemain: 0,
    activeSellers: 0,
    totalSellers: 0,
    totalProducts: 0
  };
  const sellerStats = Array.isArray(data?.sellerStats) ? data.sellerStats : [];
  const topProducts = Array.isArray(data?.topProducts) ? data.topProducts : [];
  const weeklyTrend = Array.isArray(data?.weeklyTrend) ? data.weeklyTrend : [];
  const todayDate = data?.todayDate || '';

  const sellThroughRate = summary.totalSent > 0
    ? Math.round((summary.totalSold / summary.totalSent) * 100)
    : 0;

  // คำนวณค่าสูงสุดสำหรับสเกลกราฟ 7 วัน
  const maxTrendSent = Math.max(...weeklyTrend.map(t => Number(t.total_sent) || 0), 10);

  return (
    <div className="min-h-screen bg-[#fffdf7] pb-12 font-sans text-gray-900 select-text">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="bg-white/80 backdrop-blur-xs border-b border-amber-100 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 px-3.5 py-1.5 rounded-full active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={14} className="text-amber-700" />
            <span>กลับหน้าป้อนข้อมูล</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">อัปเดต {lastUpdated} น.</span>

            <button
              onClick={loadData}
              className="p-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full hover:bg-amber-100 active:rotate-180 transition-all cursor-pointer shadow-2xs"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={14} className="text-amber-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout (Wrapped in capture ref) */}
      <div ref={dashboardCaptureRef} className="bg-[#fffdf7]">
        <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          {/* Header Title Section */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-700">
              <BarChart3 size={14} className="text-amber-600" />
              <span>REAL-TIME ANALYTICS DASHBOARD</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              สรุปยอดขายประจำวัน
            </h1>

            <div className="pt-1">
              <div className="inline-flex items-center gap-2 text-xs text-amber-950 font-bold bg-white border border-amber-200/90 px-3 py-1.5 rounded-2xl shadow-2xs">
                <Calendar size={14} className="text-amber-600 shrink-0" />
                <span>{formatDateThai(todayDate, { full: true })}</span>
              </div>
            </div>
          </div>

          {/* 🤖 PX Smart Assistant Card */}
          <AIInsightCard dashboardData={data} />

          {/* 🌟 4 Cards Summary KPIs (2x2 Grid on Mobile, 4 Cols on Desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: ส่งรวมทั้งหมด */}
            <div className="bg-white rounded-3xl p-4 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">ส่งรวมทั้งหมด</span>
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Package size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {summary.totalSent.toLocaleString()}
                </div>
                <span className="text-[11px] text-gray-400 font-medium">จาก {summary.totalProducts} รายการสินค้า</span>
              </div>
            </div>

            {/* Card 2: ขายได้รวม */}
            <div className="bg-white rounded-3xl p-4 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">ขายได้รวม</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                  {summary.totalSold.toLocaleString()}
                </div>
                <span className="text-[11px] text-gray-400 font-medium">ยอดคงเหลือ: {summary.totalRemain.toLocaleString()}</span>
              </div>
            </div>

            {/* Card 3: อัตราขายได้ */}
            <div className="bg-white rounded-3xl p-4 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">อัตราขายได้</span>
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                  {sellThroughRate}%
                </div>
                <div className="w-full bg-amber-100 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(sellThroughRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 4: ผู้ฝากลงรายการ */}
            <div className="bg-white rounded-3xl p-4 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">ผู้ฝากลงรายการ</span>
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {summary.activeSellers} <span className="text-sm font-normal text-gray-400">/ {summary.totalSellers} คน</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                  {summary.activeSellers === summary.totalSellers ? '✓ ครบทุกคนแล้ว' : `ขาดอีก ${summary.totalSellers - summary.activeSellers} คน`}
                </span>
              </div>
            </div>
          </div>

          {/* 🌟 Main Responsive Grid (Desktop: 2-Cols on Left, 1-Col on Right; Mobile: 1 Col Stacked) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* 👈 Left Column (Span 2 on Desktop): ประสิทธิภาพผู้ฝากขายวันนี้ */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-4 border border-amber-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                    <User size={15} />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">
                    ประสิทธิภาพผู้ฝากขายวันนี้
                  </h2>
                </div>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Info size={11} /> แตะแถบเพื่อดูสินค้า
                </span>
              </div>

              <div className="space-y-2">
                {sellerStats.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6">ยังไม่มีข้อมูลรายงานของวันนี้</p>
                ) : (
                  sellerStats.map((s, idx) => {
                    const isExpanded = openSellers[s.seller_id] !== undefined
                      ? openSellers[s.seller_id]
                      : (idx === 0 && openSellers.default_first && s.products?.length > 0);
                    const rate = s.total_sent > 0 ? Math.round((s.total_sold / s.total_sent) * 100) : 0;
                    const products = Array.isArray(s.products) ? s.products : [];

                    return (
                      <div
                        key={s.seller_id}
                        className="border border-amber-100/90 rounded-2xl overflow-hidden bg-white shadow-2xs"
                      >
                        {/* Header Row */}
                        <div
                          onClick={() => toggleSeller(s.seller_id)}
                          className="p-3 hover:bg-amber-50/40 cursor-pointer select-none transition-colors"
                        >
                          <div className="flex justify-between items-center text-xs mb-1">
                            <div className="flex items-center gap-2 font-bold text-gray-800">
                              {isExpanded ? <ChevronUp size={14} className="text-amber-700" /> : <ChevronDown size={14} className="text-gray-400" />}
                              <span>{s.seller_name}</span>
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                {products.length} รายการ
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">
                                <strong className={s.total_sold > 0 ? 'text-emerald-600' : 'text-gray-700'}>{s.total_sold}</strong>
                                <span className="text-gray-400"> / {s.total_sent} ({rate}%)</span>
                              </span>
                              {/* <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSharingSeller({ id: s.seller_id, name: s.seller_name });
                                }}
                                className="p-1.5 text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
                                title={`แชร์รายงานส่วนบุคคลให้ ${s.seller_name}`}
                              >
                                <Share2 size={13} />
                              </button> */}
                            </div>
                          </div>

                          {/* Horizontal Progress Bar */}
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex mt-2">
                            <div
                              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <div className="p-3 bg-amber-50/20 border-t border-amber-100 space-y-1.5 text-xs">
                            {products.length === 0 ? (
                              <p className="text-[11px] text-gray-400 text-center py-1">ไม่มีการลงรายการสินค้าในวันนี้</p>
                            ) : (
                              products.map((p) => (
                                <div key={p.product_id} className="flex justify-between items-center py-1.5 border-b border-amber-100/60 last:border-0">
                                  <span className="font-bold text-gray-800 text-xs">{p.product_name}</span>
                                  <div className="flex items-center gap-2 text-xs font-semibold">
                                    <span className="text-gray-500">ส่ง <strong>{p.sent}</strong></span>
                                    <span className="text-emerald-600 font-bold">ขาย {p.sold}</span>
                                    <span className="text-purple-600 font-bold">เหลือ {p.remain} {p.unit}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 👉 Right Column (Span 1 on Desktop): 5 สินค้าขายดีวันนี้ & ยอดขาย 7 วันย้อนหลัง */}
            <div className="space-y-4">
              {/* 5 สินค้าขายดีวันนี้ */}
              <div className="bg-white rounded-3xl p-4 border border-amber-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                      <Trophy size={15} className="text-amber-600" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">5 สินค้าขายดีวันนี้</h2>
                  </div>
                  <span className="text-[10px] text-amber-900 font-bold bg-amber-50 border border-amber-200/90 px-2.5 py-0.5 rounded-full">
                    ยอดขาย × %ขายได้
                  </span>
                </div>

                <div className="space-y-2">
                  {topProducts.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4 italic">ยังไม่มียอดขายในวันนี้</p>
                  ) : (
                    topProducts.map((item, index) => (
                      <div
                        key={item.product_id}
                        className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-amber-100/80 bg-white shadow-2xs text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 shadow-2xs ${index === 0
                              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white font-black shadow-amber-500/20'
                              : index === 1
                                ? 'bg-amber-100/90 text-amber-900 border border-amber-200 font-black'
                                : index === 2
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200/80 font-black'
                                  : 'bg-gray-100/90 text-gray-600 border border-gray-200 font-bold'
                            }`}>
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate">{item.product_name}</div>
                            <div className="text-[10px] text-gray-400 truncate">ฝากโดย: {item.seller_name}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-black text-emerald-600 text-xs">
                              ขาย {item.sold} {item.unit}
                            </span>
                            <span className="text-[10px] text-amber-900 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                              {item.sell_rate}%
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                            ส่ง {item.sent} | เหลือ {item.remain}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ยอดขาย 7 วันย้อนหลัง */}
              <div className="bg-white rounded-3xl p-4 border border-amber-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                      <Calendar size={15} className="text-amber-600" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">ยอดขาย 7 วันย้อนหลัง</h2>
                  </div>

                  {/* Switcher Pill */}
                  <div className="flex items-center bg-amber-50/80 p-0.5 rounded-xl border border-amber-200 text-xs">
                    <button
                      onClick={() => setTrendViewMode('chart')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${trendViewMode === 'chart'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-amber-900 hover:text-amber-950'
                        }`}
                    >
                      <BarChart2 size={12} />
                      <span>กราฟ</span>
                    </button>
                    <button
                      onClick={() => setTrendViewMode('list')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${trendViewMode === 'list'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-amber-900 hover:text-amber-950'
                        }`}
                    >
                      <List size={12} />
                      <span>ตาราง</span>
                    </button>
                  </div>
                </div>

                {weeklyTrend.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 italic">ยังไม่มีข้อมูลรายงานย้อนหลัง</p>
                ) : trendViewMode === 'chart' ? (
                  /* 📊 7 Capsule Bars View */
                  <div className="space-y-3 pt-2">
                    <div className="flex items-end justify-between gap-1 sm:gap-2 h-36 px-1 relative">
                      {weeklyTrend.map((t, index) => {
                        const sent = Number(t.total_sent) || 0;
                        const sold = Number(t.total_sold) || 0;
                        const remain = Number(t.total_remain) || 0;
                        const rate = sent > 0 ? Math.round((sold / sent) * 100) : 0;
                        const soldRatio = sent > 0 ? (sold / sent) : 0;
                        const barFillPercent = Math.max(Math.round((sent / maxTrendSent) * 100), 15);
                        const isSelected = activeTooltipDate === t.date;

                        const isFirst = index === 0;
                        const isLast = index === weeklyTrend.length - 1;
                        const isNearLast = index === weeklyTrend.length - 2;

                        return (
                          <div
                            key={t.date}
                            className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                            onMouseEnter={() => setActiveTooltipDate(t.date)}
                            onMouseLeave={() => setActiveTooltipDate(null)}
                            onClick={() => setActiveTooltipDate(activeTooltipDate === t.date ? null : t.date)}
                          >
                            {/* Floating Tooltip Box (Smart Responsive Alignment) */}
                            <div
                              className={`absolute -top-16 bg-gray-900/95 text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-xl z-30 pointer-events-none transition-all duration-200 whitespace-nowrap border border-gray-700 ${isLast
                                  ? 'right-0 left-auto translate-x-0'
                                  : isFirst
                                    ? 'left-0 translate-x-0'
                                    : isNearLast
                                      ? 'right-[-16px] sm:left-1/2 sm:-translate-x-1/2 sm:right-auto'
                                      : 'left-1/2 -translate-x-1/2'
                                } ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                                }`}
                            >
                              <div className="font-bold text-amber-300 pb-0.5 border-b border-gray-700 text-center text-[11px]">
                                {formatDateThai(t.date)}
                              </div>
                              <div className="flex items-center gap-2 pt-1 font-bold text-[10px]">
                                <span className="text-emerald-400">ขาย {sold} ({rate}%)</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-amber-300">ส่ง {sent}</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-purple-300">เหลือ {remain}</span>
                              </div>
                              {/* Tooltip Arrow */}
                              <div className={`absolute top-full border-4 border-transparent border-t-gray-900/95 ${isLast
                                  ? 'right-4 left-auto'
                                  : isFirst
                                    ? 'left-4'
                                    : isNearLast
                                      ? 'right-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto'
                                      : 'left-1/2 -translate-x-1/2'
                                }`} />
                            </div>

                            {/* Top Percentage Label */}
                            <span className={`text-[10px] font-bold mb-1 transition-colors ${isSelected ? 'text-amber-700 scale-110' : 'text-gray-600'
                              }`}>
                              {rate}%
                            </span>

                            {/* Capsule Column Track (Rounded-2xl Cream Track) */}
                            <div className={`w-full max-w-[28px] h-24 bg-amber-100/60 rounded-xl overflow-hidden flex flex-col justify-end relative transition-all ${isSelected ? 'ring-2 ring-amber-500 scale-105 shadow-md' : 'group-hover:ring-1 group-hover:ring-amber-400'
                              }`}>
                              {/* Sent Height Yellow Fill */}
                              <div
                                className="w-full bg-amber-400 rounded-xl overflow-hidden flex flex-col justify-end transition-all duration-300"
                                style={{ height: `${barFillPercent}%` }}
                              >
                                {/* Sold Height Emerald Fill */}
                                <div
                                  className="w-full bg-emerald-500 rounded-xl transition-all duration-500"
                                  style={{ height: `${Math.min(Math.round(soldRatio * 100), 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Bottom Date Label */}
                            <span className={`text-[10px] mt-1.5 font-bold transition-colors ${isSelected ? 'text-amber-900 font-black' : 'text-gray-500'
                              }`}>
                              {t.date ? t.date.split('-').slice(1).reverse().join('/') : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend & Summary Tag */}
                    <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-amber-100/70">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 font-bold text-[11px]">
                          <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                          <span>ขายได้</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-[11px]">
                          <span className="w-3 h-3 rounded-xs bg-amber-400"></span>
                          <span>ส่งรวม</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {weeklyTrend.length} วันล่าสุด
                      </span>
                    </div>
                  </div>
                ) : (
                  /* 📋 List View */
                  <div className="space-y-1.5">
                    {weeklyTrend.map((t) => (
                      <div key={t.date} className="flex justify-between items-center py-2 border-b border-amber-100/60 last:border-0 text-xs">
                        <span className="text-xs font-bold text-gray-800">{formatDateThai(t.date)}</span>
                        <div className="flex gap-2.5 text-[11px] font-semibold">
                          <span className="text-gray-500">ส่ง {t.total_sent}</span>
                          <span className="font-bold text-emerald-600">ขาย {t.total_sold}</span>
                          <span className="text-purple-600 font-bold">เหลือ {t.total_remain}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
