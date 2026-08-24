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
import { generateReportText } from '../utils/generateReport';
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

  const toggleSeller = (key) => {
    setOpenSellers((prev) => {
      const isCurrentlyOpen = prev[key] !== false;
      return { ...prev, [key]: !isCurrentlyOpen };
    });
  };

  // 🟢 ปรับให้แปลงข้อมูลจาก History มาใช้ generateReportText ร่วมกัน
  const handleCopyReportByDate = async (date, sellersGroup, e) => {
    e.stopPropagation();

    // แปลงโครงสร้างข้อมูลจาก History ให้เข้ากับ generateReportText
    const sellersList = [];
    const productsList = [];

    Object.entries(sellersGroup).forEach(([sellerName, products], index) => {
      const sellerId = index + 1;
      sellersList.push({ id: sellerId, name: sellerName });

      products.forEach((prod) => {
        productsList.push({
          seller_id: sellerId,
          name: prod.product_name,
          sent: prod.sent,
          sold: prod.sold,
          remain: prod.remain,
          unit: prod.unit
        });
      });
    });

    // เรียกใช้ utils สรรสร้างข้อความรายงาน
    const reportText = generateReportText(sellersList, productsList);

    const success = await copyToClipboard(reportText);
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
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-lg md:max-w-3xl lg:max-w-4xl h-[88vh] md:h-[82vh] rounded-t-3xl sm:rounded-2xl p-0 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                📜 ประวัติรายงานย้อนหลัง
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">คัดลอกข้อความสรุปหรือจัดการประวัติรายงานประจำวัน</p>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2.5 text-xs">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span className="font-medium">กำลังโหลดประวัติย้อนหลัง...</span>
              </div>
            ) : Object.keys(historyData).length === 0 ? (
              <div className="text-center py-20 text-xs text-gray-400">
                ยังไม่มีประวัติการบันทึกรายงาน
              </div>
            ) : (
              <>
                {Object.entries(historyData).map(([date, sellers]) => {
                  const isDateOpen = !!openDates[date];
                  const isCopied = copiedDate === date;

                  return (
                    <div key={date} className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden transition-all">
                      
                      {/* Date Header */}
                      <div
                        onClick={() => toggleDate(date)}
                        className="flex justify-between items-center p-4 bg-gray-50/90 hover:bg-gray-100/60 cursor-pointer select-none border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Calendar size={18} className="text-blue-600 shrink-0" />
                          <span className="text-sm font-bold text-gray-800">
                            {formatDateThai(date, { full: true })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* ปุ่มคัดลอก */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyReportByDate(date, sellers, e)}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-2xs'
                            }`}
                            title="คัดลอกรายงาน"
                          >
                            {isCopied ? <Check size={13} /> : <Copy size={13} />}
                            <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอกรายงาน'}</span>
                          </button>

                          {/* ปุ่มลบ */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(date, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบประวัติของวันนี้"
                          >
                            <Trash2 size={16} />
                          </button>

                          <span className="text-gray-400 p-0.5 ml-0.5">
                            {isDateOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </div>
                      </div>

                      {/* Date Content */}
                      {isDateOpen && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(sellers).map(([sellerName, products]) => {
                              const sellerKey = `${date}-${sellerName}`;
                              const isSellerOpen = openSellers[sellerKey] !== false;

                              return (
                                <div key={sellerName} className="border border-gray-200/70 rounded-xl overflow-hidden bg-white shadow-2xs">
                                  
                                  {/* FULL-WIDTH TOUCH HEADER */}
                                  <button
                                    type="button"
                                    onClick={() => toggleSeller(sellerKey)}
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-blue-50/50 hover:bg-blue-50/80 transition-colors select-none text-left cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="p-1 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                                        <User size={13} />
                                      </span>
                                      <span className="font-bold text-xs text-gray-800 truncate">
                                        {sellerName}
                                      </span>
                                      <span className="text-[10px] font-semibold text-blue-600 bg-white border border-blue-100 px-2 py-0.5 rounded-full shrink-0">
                                        {products.length} รายการ
                                      </span>
                                    </div>

                                    <span className="text-gray-400 p-0.5 ml-2 shrink-0">
                                      {isSellerOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    </span>
                                  </button>

                                  {/* Product List */}
                                  {isSellerOpen && (
                                    <div className="p-3 space-y-2 bg-white divide-y divide-gray-100">
                                      {products.map((p) => (
                                        <div key={p.id} className="flex justify-between items-center text-xs pt-2 first:pt-0">
                                          <span className="text-gray-800 font-medium truncate max-w-[140px]">
                                            {p.product_name}
                                          </span>
                                          <div className="flex items-center gap-2 text-gray-500 font-mono text-[11px]">
                                            <span>ส่ง <b className="text-gray-800">{p.sent}</b></span>
                                            <span>ขาย <b className="text-emerald-600 font-bold">{p.sold}</b></span>
                                            <span>เหลือ <b className="text-gray-800">{p.remain}</b></span>
                                            <span className="text-[10px] text-gray-400 min-w-7 text-right">{p.unit}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
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
                      className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-blue-600" />
                          <span>กำลังดึงข้อมูล...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={15} />
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
