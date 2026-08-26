import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
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
  Archive,
  RotateCcw,
  SearchX,
  EyeOff,
  ClockAlert,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  Filter,
  Flame,
  CheckCheck
} from 'lucide-react';
import { getSingleSellerDashboard } from '../services/dashboardService';
import { formatDateThai } from '../utils/formatDate';
import { copyToClipboard } from '../utils/clipboard';
import { vibrateSuccess } from '../utils/haptics';
import { parseShareToken } from '../utils/shareCrypto';
import Footer from './Footer';
import Loading from './Loading';

// 🔢 Component สำหรับทำตัวเลขวิ่ง (Animated Counter)
function AnimatedCounter({ value, suffix = '' }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => 
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(numericValue);
  }, [spring, numericValue]);

  return (
    <span>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

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

    // กรณีเป็น ID ตัวเลขแบบเก่า (Fallback)
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

  // 🔍 State สำหรับตัวกรองสินค้า (Filter)
  const [productFilter, setProductFilter] = useState('all'); // 'all' | 'sold_out' | 'has_remain' | 'not_sent'
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterMenuRef = useRef(null);

  // 📅 State สำหรับ Custom Bento DatePicker Modal
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerView, setPickerView] = useState('calendar'); // 'calendar' | 'months' | 'years'

  const today = useMemo(() => new Date(), []);
  const maxYear = today.getFullYear();
  const maxMonth = today.getMonth();
  const minYear = maxYear - 4;

  const [pickerYear, setPickerYear] = useState(maxYear);
  const [pickerMonth, setPickerMonth] = useState(maxMonth);

  // 🛑 ล็อกไม่ให้หน้าหลัง Scroll ได้เมื่อเปิด DatePicker Modal
  useEffect(() => {
    if (isDatePickerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDatePickerOpen]);

  // 🛑 ปิด Filter Dropdown เมื่อคลิกที่อื่น
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      // ซิงค์เดือนและปีในปฏิทินให้ตรงกับวันที่โหลด
      if (res.queryDate) {
        const [y, m] = res.queryDate.split('-').map(Number);
        if (y && m) {
          setPickerYear(y);
          setPickerMonth(m - 1);
        }
      }

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

  // Document Title ตามสถานะ
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

    return () => {
      document.title = 'PX Daily Report';
    };
  }, [data, isExpired, isValidToken]);

  // 📅 ปฏิทิน Helpers
  const allowedYears = useMemo(() => {
    const list = [];
    for (let yr = maxYear; yr >= minYear; yr--) list.push(yr);
    return list;
  }, [maxYear, minYear]);

  const canGoNext = pickerYear < maxYear || (pickerYear === maxYear && pickerMonth < maxMonth);
  const canGoPrev = pickerYear > minYear || (pickerYear === minYear && pickerMonth > 0);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear((prev) => prev - 1);
    } else {
      setPickerMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear((prev) => prev + 1);
    } else {
      setPickerMonth((prev) => prev + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const available = data?.availableDates || [];
    const firstDayIndex = new Date(pickerYear, pickerMonth, 1).getDay();
    const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null, hasData: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(pickerMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${pickerYear}-${monthStr}-${dayStr}`;
      const hasData = available.includes(dateStr);

      days.push({ day: d, dateStr, hasData });
    }

    return days;
  }, [pickerYear, pickerMonth, data?.availableDates]);

  const handleSelectDateFromPicker = (dateStr) => {
    setIsDatePickerOpen(false);
    setPickerView('calendar');
    setSelectedDate(dateStr);
    loadData(dateStr);
  };

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const monthShortThai = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const handleCopyReport = async () => {
    if (!data || !data.seller) return;
    const { seller, queryDate, summary, products } = data;

    let text = `สรุปยอดขาย : ${seller.name}\n`;
    text += `ประจำวันที่ : ${formatDateThai(queryDate, { full: true })}\n`;
    text += `--------------------------------\n`;

    if (showProducts) {
      (products || []).forEach((p) => {
        text += `• ${p.product_name}: ส่ง ${p.sent} | ขาย ${p.sold} | เหลือ ${p.remain} ${p.unit} (${p.sell_rate}%)\n`;
      });
      text += `--------------------------------\n`;
    }

    if (showKpi) {
      text += `รวมส่ง: ${summary.totalSent} | ขายได้: ${summary.totalSold} | คงเหลือ: ${summary.totalRemain} (${summary.sellThroughRate}%)\n`;
    }

    const success = await copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      vibrateSuccess();
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // 🔍 กรองรายการสินค้าตาม Filter ที่เลือก
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    return data.products.filter((p) => {
      const sentNum = Number(p.sent) || 0;
      const remainNum = Number(p.remain) || 0;

      if (productFilter === 'sold_out') {
        return sentNum > 0 && remainNum === 0;
      }
      if (productFilter === 'has_remain') {
        return sentNum > 0 && remainNum > 0;
      }
      if (productFilter === 'not_sent') {
        return sentNum === 0;
      }
      return true; // 'all'
    });
  }, [data?.products, productFilter]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#fffdf7] flex items-center justify-center p-4">
        <div className="absolute bottom-1/4">
          <Loading message='กำลังโหลดข้อมูลที่แชร์' />
        </div>
      </div>
    );
  }

// หน้าจอ Error / Expired (Clean & Secure Guest View)
  if (error || !data || !isValidToken) {
    return (
      <div className="min-h-screen bg-[#fffdf7] flex flex-col justify-between p-4 sm:p-6 font-sans select-none">
        {/* โลโก้แบรนด์มุมซ้ายบนแบบเรียบง่าย */}
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

        {/* การ์ดแจ้งเตือนกึ่งกลางหน้าจอ (ไม่มีปุ่มไปหน้าหลัก) */}
        <main className="max-w-sm w-full mx-auto my-auto py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 text-center shadow-xs space-y-4"
          >
            {/* Icon Status */}
            <div
              className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-2xs ${
                isExpired
                  ? 'bg-rose-50 border border-rose-200 text-rose-600'
                  : 'bg-amber-50 border border-amber-200 text-amber-600'
              }`}
            >
              {isExpired ? (
                <ClockAlert size={32} className="stroke-[1.75]" />
              ) : (
                <SearchX size={32} className="stroke-[1.75]" />
              )}
              <span
                className={`absolute -top-2 -right-2 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs ${
                  isExpired ? 'bg-rose-500' : 'bg-amber-500'
                }`}
              >
                {isExpired ? 'Expired' : '404'}
              </span>
            </div>

            {/* ข้อความแจ้งเตือน */}
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                {isExpired ? 'ลิงก์รายงานหมดอายุ' : 'ไม่พบข้อมูลผู้ฝากขาย'}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                {error}
              </p>
            </div>
          </motion.div>
        </main>

        {/* Footer ด้านล่าง */}
        <div className="pb-4 px-2">
          <Footer title="PX Daily Report System • ระบบรายงานยอดขายส่วนบุคคล " />
        </div>
      </div>
    );
  }

  const { seller, queryDate, summary, products, weeklyTrend, availableDates } = data;
  const maxTrendSent = Math.max(...weeklyTrend.map((t) => Number(t.total_sent) || 0), 10);
  const isEverythingHidden = !showKpi && !showProducts && !showTrend;

  const filterOptions = [
    { id: 'all', label: 'ทั้งหมด', icon: Package, count: products.length },
    { id: 'sold_out', label: 'หมดเกลี้ยง', icon: Flame, count: products.filter(p => Number(p.sent) > 0 && Number(p.remain) === 0).length },
    { id: 'has_remain', label: 'ยังไม่หมด', icon: Archive, count: products.filter(p => Number(p.sent) > 0 && Number(p.remain) > 0).length },
    { id: 'not_sent', label: 'ไม่ได้ส่ง', icon: EyeOff, count: products.filter(p => Number(p.sent) === 0).length },
  ];

  const currentFilterObj = filterOptions.find(f => f.id === productFilter) || filterOptions[0];

  return (
    <div className="min-h-screen bg-[#fffdf7] pb-0 font-sans text-gray-900 select-text flex flex-col justify-between select-auto">
      <div>
        {/* Header Bar */}
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
              <span className="text-xs text-gray-500 font-medium">อัปเดต {lastUpdated} น.</span>

              {!isEverythingHidden && (
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className={`flex items-center gap-1.5 text-xs font-bold px-1.5 sm:px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${isCopied
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 active:scale-95'
                    }`}
                  title="คัดลอกสรุปยอดขาย"
                >
                  {isCopied ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} className="text-amber-700" />}
                  <span className="hidden sm:inline">{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกรายงาน'}</span>
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-4 sm:space-y-6">
          {/* Subheader แถบเดียวก่อนเข้าเนื้อหา */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 pt-1 pb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                สรุปรายงานยอดขายประจำวัน
              </span>
            </div>

            {/* 📅 Bento Calendar Picker Button */}
            {allowDate && availableDates && availableDates.length > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setPickerView('calendar');
                  setIsDatePickerOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100/80 active:bg-amber-200/70 border border-amber-300/90 text-amber-950 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
                title="คลิกเพื่อเลือกดูรายงานย้อนหลังผ่านปฏิทิน"
              >
                <CalendarDays size={14} className="text-amber-700 shrink-0" />
                <span>{formatDateThai(selectedDate || queryDate, { full: true })}</span>
                <ChevronDown size={13} className="text-amber-600 ml-0.5" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-900 font-bold bg-amber-100/50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                <Calendar size={13} className="text-amber-700 shrink-0" />
                <span>{formatDateThai(queryDate, { full: true })}</span>
              </div>
            )}
          </div>

          {/* Empty State กรณีไม่มีข้อมูล */}
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

          {/* 🌟 4 KPI Cards (Animated Number Counter) */}
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
                    <AnimatedCounter value={summary.totalSent} />
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
                    <AnimatedCounter value={summary.totalSold} />
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
                    <AnimatedCounter value={summary.totalRemain} />
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
                    <AnimatedCounter value={summary.sellThroughRate} suffix="%" />
                  </div>
                  <div className="w-full bg-amber-100 h-2 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(summary.sellThroughRate, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full"
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
                  
                  {/* 🏷️ Header แถวบนของรายการสินค้า + ปุ่ม Filter Dropdown */}
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3 relative">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                        <Package size={15} className="text-amber-600" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900">
                        รายการสินค้า ({filteredProducts.length}/{products.length})
                      </h3>
                    </div>

                    {/* 🔘 ปุ่ม Filter Dropdown สไตล์ Bento */}
                    <div className="relative" ref={filterMenuRef}>
                      <button
                        type="button"
                        onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                          productFilter !== 'all'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-amber-50/80 hover:bg-amber-100 text-amber-900 border-amber-200'
                        }`}
                        title="กรองการแสดงผลสินค้า"
                      >
                        <Filter size={12} className={productFilter !== 'all' ? 'text-white' : 'text-amber-700'} />
                        <span>{currentFilterObj.label}</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu Popup */}
                      <AnimatePresence>
                        {isFilterDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-amber-200/90 py-1.5 z-40 overflow-hidden"
                          >
                            <div className="text-[10px] font-bold text-gray-400 px-3 py-1 border-b border-gray-100">
                              กรองตามสถานะ:
                            </div>
                            {filterOptions.map((opt) => {
                              const isSelected = productFilter === opt.id;
                              const IconComp = opt.icon;

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setProductFilter(opt.id);
                                    setIsFilterDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors cursor-pointer text-left ${
                                    isSelected
                                      ? 'bg-amber-50 text-amber-900'
                                      : 'text-gray-700 hover:bg-amber-50/50 hover:text-amber-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComp size={13} className={isSelected ? 'text-amber-600' : 'text-gray-400'} />
                                    <span>{opt.label}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                                      isSelected ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {opt.count}
                                    </span>
                                    {isSelected && <CheckCheck size={13} className="text-amber-600" />}
                                  </div>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {filteredProducts.length === 0 ? (
                      <div className="py-12 col-span-full text-center space-y-2">
                        <Archive size={28} className="text-gray-300 mx-auto" />
                        <p className="text-xs font-bold text-gray-400">ไม่พบรายการสินค้าในหมวดหมู่นี้</p>
                        <button
                          type="button"
                          onClick={() => setProductFilter('all')}
                          className="text-xs text-amber-700 hover:underline font-bold"
                        >
                          แสดงสินค้าทั้งหมด
                        </button>
                      </div>
                    ) : (
                      filteredProducts.map((p, index) => {
                        const sentNum = Number(p.sent) || 0;
                        const remainNum = Number(p.remain) || 0;
                        const isSoldOut = sentNum > 0 && remainNum === 0;
                        const isZeroSent = sentNum === 0;

                        return (
                          <motion.div
                            key={p.product_id || index}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.04 }}
                            whileHover={{ y: -2, transition: { duration: 0.15 } }}
                            className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden shadow-2xs ${
                              isZeroSent
                                ? 'bg-gray-50/60 border-gray-200/70 opacity-55'
                                : isSoldOut
                                ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                                : 'bg-white border-amber-100/90 hover:border-amber-300'
                            }`}
                          >
                            {/* Header แถวบน: ชื่อสินค้า + Badges */}
                            <div className="flex justify-between items-center gap-2 text-xs">
                              <div className="flex items-start gap-1 min-w-0">
                                <span className="font-bold text-gray-900 text-sm truncate">
                                  {p.product_name}
                                </span>
                                {isSoldOut && (
                                  <Flame className="text-amber-600 shrink-0" size={15} strokeWidth={3} title="สินค้าหมดเกลี้ยง" />
                                )}
                              </div>

                              <span
                                className={`text-[11px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                                  isSoldOut
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                    : isZeroSent
                                    ? 'bg-gray-100 text-gray-400 border-gray-200'
                                    : 'bg-amber-50 text-amber-900 border-amber-200'
                                }`}
                              >
                                {p.sell_rate}%
                              </span>
                            </div>

                            {/* ตัวเลข ส่ง / ขาย / เหลือ */}
                            <div className="flex items-center justify-between text-xs pt-2 pb-1">
                              <div className="flex items-center gap-3 text-xs font-semibold">
                                <span className="text-gray-500">
                                  ส่ง <strong>{p.sent}</strong>
                                </span>
                                <span className="text-emerald-600 font-bold">
                                  ขาย {p.sold}
                                </span>
                                <span className="text-purple-600 font-bold">
                                  เหลือ {p.remain} {p.unit}
                                </span>
                              </div>
                            </div>

                            {/* 🌈 Progress Bar โทน Warm Amber -> Emerald */}
                            <div className="w-full bg-amber-100/60 h-1.5 rounded-full overflow-hidden flex mt-1">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(p.sell_rate, 100)}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.04 }}
                                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                              />
                            </div>
                          </motion.div>
                        );
                      })
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

      {/* 📅 Custom Bento DatePicker Modal (Backdrop พร้อมล็อกการ Scroll) */}
      <AnimatePresence>
        {isDatePickerOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 overscroll-contain touch-none"
            onClick={() => {
              setIsDatePickerOpen(false);
              setPickerView('calendar');
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-amber-200"
            >
              {/* Header Selector */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3 gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={!canGoPrev}
                  className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                    canGoPrev
                      ? 'hover:bg-amber-50 text-gray-700 hover:text-amber-800 cursor-pointer'
                      : 'opacity-20 cursor-not-allowed text-gray-300'
                  }`}
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPickerView(pickerView === 'months' ? 'calendar' : 'months')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      pickerView === 'months'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/80'
                    }`}
                  >
                    <span>{monthNamesThai[pickerMonth]}</span>
                    <ChevronDown size={13} className={`transition-transform ${pickerView === 'months' ? 'rotate-180' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickerView(pickerView === 'years' ? 'calendar' : 'years')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      pickerView === 'years'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/80'
                    }`}
                  >
                    <span>{pickerYear + 543}</span>
                    <ChevronDown size={13} className={`transition-transform ${pickerView === 'years' ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={!canGoNext}
                  className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                    canGoNext
                      ? 'hover:bg-amber-50 text-gray-700 hover:text-amber-800 cursor-pointer'
                      : 'opacity-20 cursor-not-allowed text-gray-300'
                  }`}
                  title={canGoNext ? 'เดือนถัดไป' : 'ไม่สามารถไปเดือนในอนาคตได้'}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* VIEW 1: Months Grid */}
              {pickerView === 'months' && (
                <div className="py-2 mb-2">
                  <div className="text-xs font-bold text-gray-500 mb-2 px-1">เลือกเดือน:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {monthNamesThai.map((mName, mIdx) => {
                      const isFutureMonth = pickerYear === maxYear && mIdx > maxMonth;
                      const isCurrentSelected = pickerMonth === mIdx;

                      return (
                        <button
                          key={mName}
                          type="button"
                          disabled={isFutureMonth}
                          onClick={() => {
                            setPickerMonth(mIdx);
                            setPickerView('calendar');
                          }}
                          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all border ${
                            isFutureMonth
                              ? 'opacity-25 bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : isCurrentSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-black'
                              : 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border-amber-200/70 cursor-pointer'
                          }`}
                        >
                          {monthShortThai[mIdx]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW 2: Years Grid */}
              {pickerView === 'years' && (
                <div className="py-2 mb-2">
                  <div className="text-xs font-bold text-gray-500 mb-2 px-1">เลือกปี (ย้อนหลังสูงสุด 4 ปี):</div>
                  <div className="grid grid-cols-2 gap-2">
                    {allowedYears.map((yr) => {
                      const isCurrentSelected = pickerYear === yr;

                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            setPickerYear(yr);
                            if (yr === maxYear && pickerMonth > maxMonth) {
                              setPickerMonth(maxMonth);
                            }
                            setPickerView('calendar');
                          }}
                          className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                            isCurrentSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-black'
                              : 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border-amber-200/70'
                          }`}
                        >
                          พ.ศ. {yr + 543}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW 3: Calendar Days Grid */}
              {pickerView === 'calendar' && (
                <>
                  <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 mb-2">
                    <span>อา</span>
                    <span>จ</span>
                    <span>อ</span>
                    <span>พ</span>
                    <span>พฤ</span>
                    <span>ศ</span>
                    <span>ส</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-4">
                    {calendarDays.map((item, idx) => {
                      if (!item.day) {
                        return <div key={`empty-${idx}`} className="h-8" />;
                      }

                      const isSelected = (selectedDate || queryDate) === item.dateStr;

                      if (!item.hasData) {
                        return (
                          <div
                            key={item.dateStr}
                            className="h-8 flex items-center justify-center text-xs text-gray-300 select-none cursor-not-allowed"
                            title="ไม่มีข้อมูลบันทึกในวันนี้"
                          >
                            {item.day}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={item.dateStr}
                          type="button"
                          onClick={() => handleSelectDateFromPicker(item.dateStr)}
                          className={`h-8 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center relative cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100 font-bold'
                          }`}
                          title="มีข้อมูลรายงาน คลิกเพื่อเปิดดู"
                        >
                          <span>{item.day}</span>
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Legend & Close Button */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>= วันที่มีรายงาน</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsDatePickerOpen(false);
                    setPickerView('calendar');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="pb-6 px-4">
        <Footer title="PX Daily Report System • ระบบรายงานยอดขายส่วนบุคคล " />
      </div>
    </div>
  );
}