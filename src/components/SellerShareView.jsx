import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Calendar,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Store,
  BarChart3,
  Sparkles,
  Archive,
  RotateCcw,
  SearchX,
  EyeOff,
  ClockAlert
} from 'lucide-react';
import { getSingleSellerDashboard } from '../services/dashboardService';
import { formatDateThai } from '../utils/formatDate';
import { copyToClipboard } from '../utils/clipboard';
import { vibrateSuccess } from '../utils/haptics';
import { parseShareToken } from '../utils/shareCrypto';
import Footer from './Footer';

export default function SellerShareView() {
  const { sellerId: rawToken } = useParams();

  // 🟢 ตรวจสอบความถูกต้องของ Token, ถอดรหัส Seller ID, สิทธิ์ และเช็ควันหมดอายุ
  const { isValidToken, isExpired, sellerId, showKpi, showProducts, showTrend, allowDate } = useMemo(() => {
    const parsed = parseShareToken(rawToken);

    if (parsed.expired) {
      return { isValidToken: false, isExpired: true, sellerId: null };
    }

    if (parsed.valid) {
      return {
        isValidToken: true,
        isExpired: false,
        sellerId: parsed.sellerId,
        showKpi: parsed.showKpi,
        showProducts: parsed.showProducts,
        showTrend: parsed.showTrend,
        allowDate: parsed.allowDate
      };
    }

    // กรณีเป็น ID ตัวเลขแบบเก่า (Fallback ป้องกันลิงก์เก่าพัง)
    const numericId = Number(rawToken);
    if (!isNaN(numericId) && numericId > 0) {
      return {
        isValidToken: true,
        isExpired: false,
        sellerId: numericId,
        showKpi: true,
        showProducts: true,
        showTrend: true,
        allowDate: true
      };
    }

    return { isValidToken: false, isExpired: false, sellerId: null };
  }, [rawToken]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeTooltipDate, setActiveTooltipDate] = useState(null);

  const loadData = async (targetDate = null) => {
    if (!sellerId) return;
    try {
      setLoading(true);
      setError('');
      const res = await getSingleSellerDashboard(sellerId, targetDate);
      if (!res || !res.found) {
        setError('ไม่พบข้อมูลผู้ฝากขายรายนี้ในระบบ');
        setData(null);
        return;
      }
      setData(res);
      setSelectedDate(res.queryDate);
      const now = new Date();
      setLastUpdated(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch (err) {
      console.error('Failed to load seller share view:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpired) {
      setLoading(false);
      setError('ลิงก์รายงานนี้หมดอายุการใช้งานแล้ว กรุณาติดต่อขอลิงก์ใหม่จากผู้ดูแล');
      return;
    }

    if (isValidToken && sellerId) {
      loadData();
    } else {
      setLoading(false);
      setError('ลิงก์รายงานไม่ถูกต้อง หรือรหัสผ่านการตรวจสอบไม่สำเร็จ');
    }
  }, [isValidToken, isExpired, sellerId]);

  // 2. จัดการ Document Title แยกตามสถานะ
  useEffect(() => {
    if (data?.seller?.name) {
      document.title = `${data.seller.name} - รายงานยอดขาย`;
    } else if (isExpired) {
      document.title = 'ลิงก์รายงานหมดอายุ - PX Daily Report';
    } else if (!isValidToken) {
      document.title = 'ลิงก์ไม่ถูกต้อง - PX Daily Report';
    } else {
      document.title = 'กำลังโหลด... - PX Daily Report';
    }

    // คืนค่าเดิมเมื่อ unmount ออกจากหน้าแชร์
    return () => {
      document.title = 'PX Daily Report';
    };
  }, [data, isExpired, isValidToken]);

  const handleDateChange = (newDate) => {
    if (!allowDate) return;
    setSelectedDate(newDate);
    loadData(newDate);
  };

  const handleCopyReport = async () => {
    if (!data || !data.seller) return;
    const { seller, queryDate, summary, products } = data;

    let text = `📦 สรุปยอดขาย: ${seller.name}\n`;
    text += `📅 ประจำวันที่: ${formatDateThai(queryDate, { full: true })}\n`;
    text += `--------------------------------\n`;

    if (showProducts) {
      (products || []).forEach((p) => {
        text += `• ${p.product_name}: ส่ง ${p.sent} | ขาย ${p.sold} | เหลือ ${p.remain} ${p.unit} (${p.sell_rate}%)\n`;
      });
      text += `--------------------------------\n`;
    }

    if (showKpi) {
      text += `📊 รวมส่ง: ${summary.totalSent} | ขายได้: ${summary.totalSold} | คงเหลือ: ${summary.totalRemain} (${summary.sellThroughRate}%)\n`;
    }

    const success = await copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      vibrateSuccess();
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#fffdf7] flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <Loader2 size={36} className="animate-spin text-amber-500 mx-auto" />
          <p className="text-xs font-bold text-amber-900">กำลังโหลดข้อมูลรายงานยอดขาย...</p>
        </div>
      </div>
    );
  }

  // หน้า Error State (กรณีไม่พบข้อมูล, ลิงก์เสีย, หรือหมดอายุ)
  if (error || !data || !isValidToken) {
    return (
      <div className="min-h-screen bg-[#fffdf7] flex flex-col justify-between p-4 sm:p-6 font-sans select-none">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Store size={16} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-tight">PX Daily Report</h1>
              <span className="text-[10px] text-amber-800 font-medium block">ระบบรายงานยอดขายส่วนบุคคล</span>
            </div>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 text-center shadow-xs space-y-4">
            <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-2xs ${isExpired
              ? 'bg-rose-50 border border-rose-200 text-rose-600'
              : 'bg-amber-50 border border-amber-200 text-amber-600'
              }`}>
              {isExpired ? (
                <ClockAlert size={32} className="stroke-[1.75]" />
              ) : (
                <SearchX size={32} className="stroke-[1.75]" />
              )}
              <span className={`absolute -top-2 -right-2 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs ${isExpired ? 'bg-rose-500' : 'bg-amber-500'
                }`}>
                {isExpired ? 'Expired' : '404'}
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-gray-900">
                {isExpired ? 'ลิงก์รายงานหมดอายุ' : 'ไม่พบข้อมูลผู้ฝากขาย'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                {error}
              </p>
            </div>

            {isValidToken && !isExpired && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => loadData()}
                  className="inline-flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-200/90 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCcw size={14} className="text-amber-700" />
                  <span>ลองโหลดข้อมูลใหม่อีกครั้ง</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  const { seller, queryDate, summary, products, weeklyTrend, availableDates } = data;
  const maxTrendSent = Math.max(...weeklyTrend.map((t) => Number(t.total_sent) || 0), 10);
  const isEverythingHidden = !showKpi && !showProducts && !showTrend;

  return (
    <div className="min-h-screen bg-[#fffdf7] pb-0 font-sans text-gray-900 select-text flex flex-col justify-between">
      <div>
        {/* Sticky Header Bar */}
        <header className="bg-amber-100/30 backdrop-blur-xl border-b border-amber-200/80 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Store size={16} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black text-gray-900 truncate">
                  {seller.name}
                </h1>
                <span className="text-[10px] text-amber-800 font-medium block leading-none">PX Daily Report</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 hidden md:inline font-medium">อัปเดต {lastUpdated} น.</span>

              {!isEverythingHidden && (
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${isCopied
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 active:scale-95'
                    }`}
                  title="คัดลอกสรุปยอดขายสำหรับส่ง LINE"
                >
                  {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-amber-700" />}
                  <span>{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกรายงาน'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => loadData(selectedDate)}
                className="p-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl hover:bg-amber-100 active:rotate-180 transition-all cursor-pointer shadow-2xs"
                title="รีเฟรชข้อมูลล่าสุด"
              >
                <RefreshCw size={14} className="text-amber-700" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 sm:space-y-6">
          {/* Subheader แถบเดียวก่อนเข้าเนื้อหา */}
          <div className="flex items-center justify-between gap-3 px-1 pt-1 pb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                สรุปรายงานยอดขายประจำวัน
              </span>
            </div>

            {/* Dropdown วันที่แบบเรียบหรู */}
            {allowDate && availableDates && availableDates.length > 1 ? (
              <div className="inline-flex items-center gap-1.5 bg-amber-100/50 hover:bg-amber-100 border border-amber-200/80 px-3 py-1.5 rounded-xl transition-colors">
                <Calendar size={13} className="text-amber-700 shrink-0" />
                <select
                  value={selectedDate || queryDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-amber-950 focus:outline-none cursor-pointer"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {formatDateThai(d, { full: true })}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-900 font-bold bg-amber-100/50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                <Calendar size={13} className="text-amber-700 shrink-0" />
                <span>{formatDateThai(queryDate, { full: true })}</span>
              </div>
            )}
          </div>

          {/* Empty State กรณีปิดการแสดงผลทุกตัว */}
          {isEverythingHidden && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-amber-200/90 text-center shadow-2xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <EyeOff size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">ไม่มีข้อมูลที่ได้รับอนุญาตให้แสดงผล</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  ผู้แชร์รายงานได้ปิดการแสดงผลของข้อมูลทุกส่วนสำหรับลิงก์นี้
                </p>
              </div>
            </div>
          )}

          {/* 🌟 4 KPI Summary Cards */}
          {showKpi && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">ส่งรวมทั้งหมด</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Package size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    {summary.totalSent.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">จาก {summary.productCount} รายการสินค้า</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">ขายได้รวม</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <ShoppingBag size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                    {summary.totalSold.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">คิดเป็น {summary.sellThroughRate}% ของยอดส่ง</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">ยอดคงเหลือ</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <Archive size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                    {summary.totalRemain.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">สินค้าที่ยังเหลือในสต็อก</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">อัตราการขายได้</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                    {summary.sellThroughRate}%
                  </div>
                  <div className="w-full bg-amber-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(summary.sellThroughRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🌟 Products & Trend Layout */}
          {(showProducts || (showTrend && weeklyTrend && weeklyTrend.length > 0)) && (
            <div className={`grid grid-cols-1 ${showTrend && weeklyTrend && weeklyTrend.length > 0 && showProducts ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-4 sm:gap-6`}>
              {/* Product List Details */}
              {showProducts && (
                <div className={`${showTrend && weeklyTrend && weeklyTrend.length > 0 ? 'lg:col-span-2' : 'lg:col-span-1'} bg-white rounded-3xl p-4 sm:p-6 border border-amber-200/90 shadow-2xs space-y-4`}>
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                        <Package size={15} className="text-amber-600" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900">
                        รายการสินค้าทั้งหมด ({products.length} รายการ)
                      </h3>
                    </div>
                    <span className="text-[10px] text-amber-900 font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      ประจำวัน
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {products.length === 0 ? (
                      <p className="text-xs text-center text-gray-400 py-10 col-span-full">ไม่มีรายการสินค้าในวันที่เลือก</p>
                    ) : (
                      products.map((p) => (
                        <div
                          key={p.product_id}
                          className="p-3.5 bg-amber-50/20 border border-amber-100/90 rounded-2xl space-y-2 hover:border-amber-300 transition-all shadow-2xs flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-center gap-2 text-xs">
                            <span className="font-bold text-gray-900 text-sm truncate">{p.product_name}</span>
                            <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">
                              {p.sell_rate}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <div className="flex items-center gap-3 text-xs font-semibold">
                              <span className="text-gray-500">ส่ง <strong>{p.sent}</strong></span>
                              <span className="text-emerald-600 font-bold">ขาย {p.sold}</span>
                              <span className="text-purple-600 font-bold">เหลือ {p.remain} {p.unit}</span>
                            </div>
                          </div>

                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex mt-1">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(p.sell_rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Trend Chart Card */}
              {showTrend && weeklyTrend && weeklyTrend.length > 0 && (
                <div className={`${!showProducts ? 'lg:col-span-1 max-w-xl mx-auto w-full' : 'space-y-4'}`}>
                  <div className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                          <BarChart3 size={15} className="text-amber-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">ยอดขาย 7 วันย้อนหลัง</h3>
                      </div>
                      <span className="text-[10px] text-amber-900 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {weeklyTrend.length} วันล่าสุด
                      </span>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-end justify-between gap-1 sm:gap-2 h-36 px-1 relative">
                        {weeklyTrend.map((t, index) => {
                          const sent = Number(t.total_sent) || 0;
                          const sold = Number(t.total_sold) || 0;
                          const remain = Number(t.total_remain) || 0;
                          const rate = sent > 0 ? Math.round((sold / sent) * 100) : 0;
                          const soldRatio = sent > 0 ? sold / sent : 0;
                          const barFillPercent = Math.max(Math.round((sent / maxTrendSent) * 100), 15);
                          const isSelected = activeTooltipDate === t.date;

                          const isFirst = index === 0;
                          const isLast = index === weeklyTrend.length - 1;
                          const isNearLast = index >= weeklyTrend.length - 2;

                          return (
                            <div
                              key={t.date}
                              className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                              onMouseEnter={() => setActiveTooltipDate(t.date)}
                              onMouseLeave={() => setActiveTooltipDate(null)}
                              onClick={() => setActiveTooltipDate(activeTooltipDate === t.date ? null : t.date)}
                            >
                              <div
                                className={`absolute -top-16 bg-gray-900/95 text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-xl z-30 pointer-events-none transition-all duration-200 whitespace-nowrap border border-gray-700 ${isLast
                                  ? 'right-0 left-auto translate-x-0'
                                  : isFirst
                                    ? 'left-0 translate-x-0'
                                    : isNearLast
                                      ? 'right-[-16px] sm:left-1/2 sm:-translate-x-1/2 sm:right-auto'
                                      : 'left-1/2 -translate-x-1/2'
                                  } ${isSelected
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
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
                                <div
                                  className={`absolute top-full border-4 border-transparent border-t-gray-900/95 ${isLast
                                    ? 'right-4 left-auto'
                                    : isFirst
                                      ? 'left-4'
                                      : isNearLast
                                        ? 'right-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto'
                                        : 'left-1/2 -translate-x-1/2'
                                    }`}
                                />
                              </div>

                              <span
                                className={`text-[10px] font-bold mb-1 transition-colors ${isSelected ? 'text-amber-700 scale-110' : 'text-gray-600'
                                  }`}
                              >
                                {rate}%
                              </span>

                              <div
                                className={`w-full max-w-[28px] h-24 bg-amber-100/60 rounded-xl overflow-hidden flex flex-col justify-end relative transition-all ${isSelected ? 'ring-2 ring-amber-500 scale-105 shadow-md' : 'group-hover:ring-1 group-hover:ring-amber-400'
                                  }`}
                              >
                                <div
                                  className="w-full bg-amber-400 rounded-xl overflow-hidden flex flex-col justify-end transition-all duration-300"
                                  style={{ height: `${barFillPercent}%` }}
                                >
                                  <div
                                    className="w-full bg-emerald-500 rounded-xl transition-all duration-500"
                                    style={{ height: `${Math.min(Math.round(soldRatio * 100), 100)}%` }}
                                  />
                                </div>
                              </div>

                              <span
                                className={`text-[10px] mt-1.5 font-bold transition-colors ${isSelected ? 'text-amber-900 font-black' : 'text-gray-500'
                                  }`}
                              >
                                {t.date ? t.date.split('-').slice(1).reverse().join('/') : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>

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
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <div className="">
        <Footer title="PX Daily Report System • ระบบรายงานยอดขายส่วนบุคคล " />
      </div>
    </div>
  );
}