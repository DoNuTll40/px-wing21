import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History,
  Calendar as CalendarIcon, 
  Copy, 
  Check, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  Loader2, 
  X,
  CalendarDays
} from 'lucide-react';
import { 
  getReportHistoryGrouped, 
  getAllAvailableDates, 
  getReportBySpecificDate, 
  deleteReportByDate 
} from '../services/historyService';
import { formatDateThai } from '../utils/formatDate';
import { generateReportText } from '../utils/generateReport';
import { copyToClipboard } from '../utils/clipboard';
import { vibrateSuccess } from '../utils/haptics';
import AdminPinModal from './AdminPinModal';

export default function HistorySheet({ isOpen, onClose }) {
  const [historyData, setHistoryData] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSpecificDate, setLoadingSpecificDate] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [openSellers, setOpenSellers] = useState({});

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerView, setPickerView] = useState('calendar'); // 'calendar' | 'months' | 'years'

  const today = useMemo(() => new Date(), []);
  const maxYear = today.getFullYear();
  const maxMonth = today.getMonth(); // 0-11
  const minYear = maxYear - 4; // ย้อนหลังได้ 4 ปี

  const [pickerYear, setPickerYear] = useState(maxYear);
  const [pickerMonth, setPickerMonth] = useState(maxMonth);

  const [copiedDate, setCopiedDate] = useState(null);
  const [deleteTargetDate, setDeleteTargetDate] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // ดึง 7 วันย้อนหลัง + รายการวันที่ทั้งหมดที่มีใน DB
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [{ historyMap }, allDatesList] = await Promise.all([
        getReportHistoryGrouped(7, 0),
        getAllAvailableDates()
      ]);

      setHistoryData(historyMap);
      setAvailableDates(allDatesList);

      const recentDates = Object.keys(historyMap);
      if (recentDates.length > 0) {
        setSelectedDate(recentDates[0]);
      } else if (allDatesList.length > 0) {
        setSelectedDate(allDatesList[0]);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      alert('เกิดข้อผิดพลาดในการโหลดประวัติย้อนหลัง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const toggleSeller = (sellerName) => {
    setOpenSellers((prev) => {
      const currentlyOpen = prev[sellerName] !== false; // default is open (true)
      return {
        ...prev,
        [sellerName]: !currentlyOpen
      };
    });
  };

  // วันที่สำหรับแสดงบนแถบเลื่อนด่วน (5-7 วันล่าสุด)
  const recentPills = useMemo(() => {
    return Object.keys(historyData).slice(0, 7);
  }, [historyData]);

  // ย้อนหลัง 4 ปี: [2566, 2567, 2568, 2569]
  const allowedYears = useMemo(() => {
    const list = [];
    for (let yr = maxYear; yr >= minYear; yr--) {
      list.push(yr);
    }
    return list;
  }, [maxYear, minYear]);

  // การกดปุ่มเดินหน้า/ถอยหลังเดือน
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

  // Helper สำหรับสร้างปฏิทินในเดือนที่เลือก
  const calendarDays = useMemo(() => {
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
      const hasData = availableDates.includes(dateStr);

      days.push({ day: d, dateStr, hasData });
    }

    return days;
  }, [pickerYear, pickerMonth, availableDates]);

  // ฟังก์ชันเลือกวันที่จาก Date Picker
  const handleSelectDateFromPicker = async (dateStr) => {
    setIsDatePickerOpen(false);
    setPickerView('calendar');
    setSelectedDate(dateStr);

    if (!historyData[dateStr]) {
      try {
        setLoadingSpecificDate(true);
        const dayReport = await getReportBySpecificDate(dateStr);
        setHistoryData((prev) => ({
          ...prev,
          [dateStr]: dayReport
        }));
      } catch (err) {
        console.error('Failed to fetch specific date:', err);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลของวันนี้');
      } finally {
        setLoadingSpecificDate(false);
      }
    }
  };

  const handleCopySelectedDateReport = async () => {
    if (!selectedDate) return;

    const sellersList = [];
    const productsList = [];

    const group = historyData[selectedDate] || {};
    Object.entries(group).forEach(([sellerName, products], index) => {
      const sellerId = index + 1;
      sellersList.push({ id: sellerId, name: sellerName });

      products.forEach((prod) => {
        productsList.push({
          seller_id: sellerId,
          product_id: prod.product_id || prod.id,
          name: prod.product_name,
          unit: prod.unit,
          sent: prod.sent,
          sold: prod.sold,
          remain: prod.remain
        });
      });
    });

    const reportText = generateReportText(sellersList, productsList);
    const success = await copyToClipboard(reportText);

    if (success) {
      setCopiedDate(selectedDate);
      vibrateSuccess();
      setTimeout(() => setCopiedDate(null), 2500);
    } else {
      alert('ไม่สามารถคัดลอกรายงานอัตโนมัติได้');
    }
  };

  const handleDeleteClick = (date) => {
    setDeleteTargetDate(date);
    setIsAdminModalOpen(true);
  };

  const handleConfirmDeleteHistory = async () => {
    if (!deleteTargetDate) return;

    try {
      await deleteReportByDate(deleteTargetDate);
      
      setHistoryData((prev) => {
        const copy = { ...prev };
        delete copy[deleteTargetDate];
        return copy;
      });

      setAvailableDates((prev) => prev.filter((d) => d !== deleteTargetDate));
      setIsAdminModalOpen(false);
      setDeleteTargetDate(null);
      vibrateSuccess();
    } catch (err) {
      console.error('Delete history error:', err);
      alert(`ลบประวัติไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'}`);
    }
  };

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const monthShortThai = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  // 🟢 Guard condition after all hooks
  if (!isOpen) return null;

  const currentSellersGroup = selectedDate ? historyData[selectedDate] || {} : {};

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="bg-white w-full max-w-lg md:max-w-3xl h-[88vh] md:h-[84vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-amber-200/80"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                <History size={18} />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  ประวัติรายงานย้อนหลัง
                </h3>
                <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium hidden sm:inline">
                  มีบันทึก {availableDates.length} วัน
                </span>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose} 
              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Date Strip (5-7 วันล่าสุด + ปุ่มปฏิทินเลือกวันที่) */}
          <div className="bg-amber-50/40 border-b border-amber-200/60 p-2.5 sm:px-4 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
              
              {/* 📅 ปุ่มเปิด DatePicker ปฏิทิน */}
              <button
                type="button"
                onClick={() => {
                  setPickerView('calendar');
                  setIsDatePickerOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shadow-amber-500/20 shrink-0 cursor-pointer"
                title="เปิดปฏิทินเลือกวันที่ในอดีตทั้งหมด"
              >
                <CalendarDays size={13} />
                <span>เลือกวันที่...</span>
              </button>

              {loading ? (
                <div className="py-1 text-xs text-amber-700 flex items-center gap-1.5 pl-2">
                  <Loader2 size={13} className="animate-spin text-amber-600" />
                  <span>กำลังโหลด...</span>
                </div>
              ) : (
                recentPills.map((date) => {
                  const isSelected = selectedDate === date;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-extrabold'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      {formatDateThai(date, { full: false })}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Date Title & Quick Copy Bar */}
          {selectedDate && (
            <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <CalendarIcon size={15} className="text-amber-600 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-gray-800 truncate">
                  {formatDateThai(selectedDate, { full: true })}
                </span>
                <span className="text-[11px] text-gray-400 font-normal shrink-0">
                  ({Object.keys(currentSellersGroup).length} ผู้ฝาก)
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* 📋 ปุ่มคัดลอกข้อความรายงาน */}
                <button
                  type="button"
                  onClick={handleCopySelectedDateReport}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs ${
                    copiedDate === selectedDate
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
                  }`}
                >
                  {copiedDate === selectedDate ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedDate === selectedDate ? 'คัดลอกแล้ว' : 'คัดลอกรายงาน'}</span>
                </button>

                {/* 🗑️ ปุ่มลบ (Admin) */}
                <button
                  type="button"
                  onClick={() => handleDeleteClick(selectedDate)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="ลบประวัติวันนี้"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Detailed Data List */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5 bg-amber-50/15">
            {loadingSpecificDate ? (
              <div className="py-16 text-center text-xs text-amber-700 flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-amber-600" />
                <span>กำลังดึงข้อมูลรายงานของวันที่เลือก...</span>
              </div>
            ) : !selectedDate ? (
              <div className="py-16 text-center text-xs text-gray-400">
                เลือกวันที่ด้านบนเพื่อดูข้อมูล
              </div>
            ) : Object.keys(currentSellersGroup).length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400">
                ไม่มีข้อมูลที่บันทึกในวันนี้
              </div>
            ) : (
              Object.entries(currentSellersGroup).map(([sellerName, products]) => {
                const isExpanded = openSellers[sellerName] !== false;
                const sellerSent = products.reduce((acc, p) => acc + (Number(p.sent) || 0), 0);
                const sellerSold = products.reduce((acc, p) => acc + (Number(p.sold) || 0), 0);

                return (
                  <div 
                    key={sellerName}
                    className="bg-white border border-gray-200/90 hover:border-amber-200 rounded-xl overflow-hidden shadow-2xs transition-all"
                  >
                    {/* Seller Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleSeller(sellerName)}
                      className="w-full flex items-center justify-between p-2.5 sm:px-3.5 bg-gray-50/90 hover:bg-amber-50/40 transition-colors select-none text-left cursor-pointer border-b border-gray-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                          {sellerName}
                        </span>
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 px-2 py-0.5 rounded-full shrink-0">
                          {products.length} รายการ
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-medium text-gray-500">
                          ส่ง <b>{sellerSent}</b> | <b className="text-emerald-600">ขาย {sellerSold}</b>
                        </span>
                        <span className="text-gray-400 p-0.5">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </div>
                    </button>

                    {/* Product List Table */}
                    {isExpanded && (
                      <div className="p-2 sm:p-3 bg-white divide-y divide-gray-100 text-xs">
                        {products.map((p) => (
                          <div 
                            key={p.id || p.product_id}
                            className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0 gap-2"
                          >
                            <span className="text-gray-800 font-medium truncate max-w-[140px] sm:max-w-[240px]">
                              {p.product_name}
                            </span>

                            <div className="flex items-center gap-2 text-[11px] text-gray-600 shrink-0 font-medium">
                              <span>ส่ง <strong className="text-gray-900 font-bold">{p.sent}</strong></span>
                              <span>ขาย <strong className="text-emerald-600 font-bold">{p.sold}</strong></span>
                              <span>เหลือ <strong className="text-purple-600 font-bold">{p.remain}</strong></span>
                              <span className="text-[10px] text-gray-400 min-w-5 text-right font-medium">{p.unit || 'ชิ้น'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* 📅 Custom Bento DatePicker Modal (ไม่มี Native Select, ไม่ไปอนาคต, ย้อนหลัง 4 ปี) */}
        <AnimatePresence>
          {isDatePickerOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-amber-200"
              >
                {/* 1. Header Selector: ปุ่มเดือน & ปี แบบ Custom Bento Pills */}
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

                  {/* Custom Bento Selectors for Month and Year */}
                  <div className="flex items-center gap-1.5">
                    {/* ปุ่มเลือกเดือน (Bento Pill) */}
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

                    {/* ปุ่มเลือกปี พ.ศ. (Bento Pill) */}
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

                {/* VIEW 1: Custom Bento Month Grid (12 เดือน) */}
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

                {/* VIEW 2: Custom Bento Year Grid (ย้อนหลัง 4 ปี) */}
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

                {/* VIEW 3: Standard Calendar Days Grid */}
                {pickerView === 'calendar' && (
                  <>
                    {/* Day of Week Labels */}
                    <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 mb-2">
                      <span>อา</span>
                      <span>จ</span>
                      <span>อ</span>
                      <span>พ</span>
                      <span>พฤ</span>
                      <span>ศ</span>
                      <span>ส</span>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-4">
                      {calendarDays.map((item, idx) => {
                        if (!item.day) {
                          return <div key={`empty-${idx}`} className="h-8" />;
                        }

                        const isSelected = selectedDate === item.dateStr;

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
                    <span>= วันที่มีรายงานบันทึก</span>
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

        {/* Modal ยืนยันสิทธิ์ Admin */}
        <AdminPinModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          onSuccess={handleConfirmDeleteHistory}
        />
      </div>
    </AnimatePresence>
  );
}
