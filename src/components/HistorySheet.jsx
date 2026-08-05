import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Copy, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  User, 
  Loader2, 
  Plus 
} from 'lucide-react';
import { getReportHistoryGrouped } from '../services/historyService';
import { deleteDailyReportByDate } from '../services/reportService';
import { formatDateThai } from '../utils/formatDate';
import { copyToClipboard } from '../utils/clipboard';
import AdminPinModal from './AdminPinModal';

export default function HistorySheet({ isOpen, onClose }) {
  const [historyData, setHistoryData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const [openDates, setOpenDates] = useState({});
  const [openSellers, setOpenSellers] = useState({});
  const [copiedDate, setCopiedDate] = useState(null);

  // States สำหรับระบบลบข้อมูล
  const [deleteDateTarget, setDeleteDateTarget] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory(0);
    }
  }, [isOpen]);

  const loadHistory = async (pageIndex = 0) => {
    try {
      if (pageIndex === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limitDays = 10;
      const offsetDays = pageIndex * limitDays;
      const { historyMap, hasMore: moreAvailable } = await getReportHistoryGrouped(limitDays, offsetDays);

      if (pageIndex === 0) {
        setHistoryData(historyMap || {});
        const dates = Object.keys(historyMap || {});
        if (dates.length > 0) {
          setOpenDates({ [dates[0]]: true });
        }
      } else {
        setHistoryData((prev) => ({ ...prev, ...historyMap }));
      }

      setHasMore(moreAvailable);
      setPage(pageIndex);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const toggleDate = (date) => {
    setOpenDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  // 🟢 แก้ไข Logic การสลับสถานะเปิด-ปิดจ่า เพื่อให้กดครั้งแรกแล้วพับปิดได้ทันที
  const toggleSeller = (key) => {
    setOpenSellers((prev) => {
      const isCurrentlyOpen = prev[key] !== false; // ถ้า undefined ให้ถือว่าเปิดอยู่ (true)
      return { ...prev, [key]: !isCurrentlyOpen }; // สลับเป็น false ตั้งแต่คลิกแรก
    });
  };

  const handleCopyReportByDate = async (date, sellers, e) => {
    e.stopPropagation();

    let reportText = `📋 **รายงานยอดฝากขายประจำวัน**\n`;
    reportText += `📅 วันที่: ${formatDateThai(date, { full: true })}\n`;
    reportText += `------------------------------------\n\n`;

    Object.entries(sellers).forEach(([sellerName, products]) => {
      products.forEach((prod) => {
        const sent = prod.sent || 0;
        const sold = prod.sold || 0;
        const remain = prod.remain !== undefined ? prod.remain : (sent - sold);
        const unit = prod.unit || 'ชิ้น';

        reportText += `${prod.product_name} (${sellerName})\n`;
        reportText += `ส่ง ${sent} ${unit}\n`;
        reportText += `ขาย ${sold} ${unit}\n`;
        reportText += `คงเหลือ ${remain} ${unit}\n\n`;
      });
    });

    const success = await copyToClipboard(reportText.trim());
    if (success) {
      setCopiedDate(date);
      setTimeout(() => setCopiedDate(null), 2500);
    } else {
      alert('ไม่สามารถคัดลอกข้อความได้');
    }
  };

  const handleDeleteClick = (date, e) => {
    e.stopPropagation();
    setDeleteDateTarget(date);
    setIsAdminModalOpen(true);
  };

  const handleConfirmDeleteHistory = async () => {
    if (!deleteDateTarget) return;

    setIsAdminModalOpen(false);

    try {
      setLoading(true);
      await deleteDailyReportByDate(deleteDateTarget);
      setDeleteDateTarget(null);
      await loadHistory(0);
    } catch (err) {
      console.error('Failed to delete history:', err);
      alert(`ลบประวัติไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Database'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-lg h-[85vh] rounded-t-3xl sm:rounded-2xl p-0 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                📜 ประวัติรายงานย้อนหลัง
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">คัดลอกข้อความสรุปหรือจัดการประวัติรายงาน</p>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2 text-xs">
                <Loader2 size={20} className="animate-spin text-blue-600" />
                <span>กำลังโหลดประวัติย้อนหลัง...</span>
              </div>
            ) : Object.keys(historyData).length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400">
                ยังไม่มีประวัติการบันทึกรายงาน
              </div>
            ) : (
              <>
                {Object.entries(historyData).map(([date, sellers]) => {
                  const isDateOpen = !!openDates[date];
                  const isCopied = copiedDate === date;

                  return (
                    <div key={date} className="bg-white border border-gray-200/70 rounded-2xl shadow-xs overflow-hidden transition-all">
                      
                      {/* Date Header */}
                      <div
                        onClick={() => toggleDate(date)}
                        className="flex justify-between items-center p-3.5 bg-gray-50/80 cursor-pointer select-none border-b border-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-blue-600 shrink-0" />
                          <span className="text-xs font-bold text-gray-800">
                            {formatDateThai(date, { full: true })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* ปุ่มคัดลอก */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyReportByDate(date, sellers, e)}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                            }`}
                            title="คัดลอกรายงาน"
                          >
                            {isCopied ? <Check size={13} /> : <Copy size={13} />}
                            <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                          </button>

                          {/* ปุ่มลบ */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(date, e)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                            title="ลบประวัติของวันนี้"
                          >
                            <Trash2 size={15} />
                          </button>

                          <span className="text-gray-400 p-0.5 ml-0.5">
                            {isDateOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </span>
                        </div>
                      </div>

                      {/* Date Content */}
                      {isDateOpen && (
                        <div className="p-3 space-y-2.5 bg-white">
                          {Object.entries(sellers).map(([sellerName, products]) => {
                            const sellerKey = `${date}-${sellerName}`;
                            const isSellerOpen = openSellers[sellerKey] !== false;

                            return (
                              <div key={sellerName} className="border border-gray-200/60 rounded-xl overflow-hidden bg-white shadow-2xs">
                                
                                {/* FULL-WIDTH TOUCH HEADER */}
                                <button
                                  type="button"
                                  onClick={() => toggleSeller(sellerKey)}
                                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-blue-50/60 hover:bg-blue-50 active:bg-blue-100/80 transition-colors select-none text-left"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="p-1 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                                      <User size={13} />
                                    </span>
                                    <span className="font-bold text-xs text-gray-800 truncate">
                                      {sellerName}
                                    </span>
                                    <span className="text-[10px] font-semibold text-blue-600 bg-white/90 border border-blue-100 px-2 py-0.5 rounded-full shrink-0">
                                      {products.length} รายการ
                                    </span>
                                  </div>

                                  <span className="text-gray-400 p-0.5 ml-2 shrink-0">
                                    {isSellerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </span>
                                </button>

                                {/* Product List */}
                                {isSellerOpen && (
                                  <div className="p-3 space-y-2 bg-white divide-y divide-gray-50">
                                    {products.map((p) => (
                                      <div key={p.id} className="flex justify-between items-center text-xs pt-1.5 first:pt-0">
                                        <span className="text-gray-700 font-medium truncate max-w-[130px]">
                                          {p.product_name}
                                        </span>
                                        <div className="flex items-center gap-2.5 text-gray-500 font-mono text-[11px]">
                                          <span>ส่ง <b className="text-gray-800">{p.sent}</b></span>
                                          <span>ขาย <b className="text-blue-600">{p.sold}</b></span>
                                          <span>เหลือ <b className="text-gray-800">{p.remain}</b></span>
                                          <span className="text-[10px] text-gray-400 min-w-8 text-right">{p.unit}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pagination Button */}
                {hasMore && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => loadHistory(page + 1)}
                      disabled={loadingMore}
                      className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all active:scale-98 disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-blue-600" />
                          <span>กำลังดึงข้อมูล...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>ดึงประวัติเพิ่ม (+10 วันย้อนหลัง)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

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
