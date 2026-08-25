import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sliders, 
  Store, 
  Package, 
  TrendingUp, 
  Calendar, 
  Eye, 
  ShieldCheck 
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { vibrateSuccess } from '../utils/haptics';

export default function ShareSellerModal({ isOpen, onClose, seller }) {
  const [showKpi, setShowKpi] = useState(true);
  const [showProducts, setShowProducts] = useState(true);
  const [showTrend, setShowTrend] = useState(true);
  const [allowDate, setAllowDate] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (!seller) return '';
    const origin = window.location.origin;
    const params = new URLSearchParams();

    if (!showKpi) params.set('kpi', '0');
    if (!showProducts) params.set('prod', '0');
    if (!showTrend) params.set('trend', '0');
    if (!allowDate) params.set('date', '0');

    const queryString = params.toString();
    return `${origin}/share/${seller.id}${queryString ? `?${queryString}` : ''}`;
  }, [seller, showKpi, showProducts, showTrend, allowDate]);

  if (!isOpen || !seller) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setIsCopied(true);
      vibrateSuccess();
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleOpenPreview = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl transition-all border border-amber-100"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
                <Share2 size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  แชร์รายงานส่วนบุคคล
                </h3>
                <p className="text-[11px] text-gray-400">สร้างลิงก์ให้ผู้ฝากดูยอดเฉพาะของตนเอง</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Seller Badge */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Store size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-gray-900 truncate">{seller.name}</div>
              <div className="text-[10px] text-amber-800 flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-600" />
                <span>เห็นเฉพาะข้อมูลของตนเอง ปลอดภัย 100%</span>
              </div>
            </div>
          </div>

          {/* View Options Customizer */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Sliders size={13} className="text-amber-600" />
              <span>เลือกสิ่งที่ต้องการให้ผู้ฝากมองเห็นในลิงก์</span>
            </div>

            <div className="space-y-2 bg-gray-50/80 p-3 rounded-2xl border border-gray-200/80">
              {/* Option 1: สรุปยอดรวม */}
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-medium text-gray-800 flex items-center gap-2">
                  <TrendingUp size={14} className="text-amber-600" />
                  ยอดรวมสรุป (ส่ง / ขาย / เหลือ / %)
                </span>
                <input
                  type="checkbox"
                  checked={showKpi}
                  onChange={(e) => setShowKpi(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded-md focus:ring-amber-400 accent-amber-500 cursor-pointer"
                />
              </label>

              {/* Option 2: รายละเอียดสินค้า */}
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-medium text-gray-800 flex items-center gap-2">
                  <Package size={14} className="text-amber-600" />
                  ตารางรายการสินค้าแต่ละรายการ
                </span>
                <input
                  type="checkbox"
                  checked={showProducts}
                  onChange={(e) => setShowProducts(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded-md focus:ring-amber-400 accent-amber-500 cursor-pointer"
                />
              </label>

              {/* Option 3: กราฟ 7 วัน */}
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-medium text-gray-800 flex items-center gap-2">
                  <Eye size={14} className="text-amber-600" />
                  กราฟสถิติยอดขายย้อนหลัง 7 วัน
                </span>
                <input
                  type="checkbox"
                  checked={showTrend}
                  onChange={(e) => setShowTrend(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded-md focus:ring-amber-400 accent-amber-500 cursor-pointer"
                />
              </label>

              {/* Option 4: เลือกดูประวัติ */}
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-medium text-gray-800 flex items-center gap-2">
                  <Calendar size={14} className="text-amber-600" />
                  อนุญาตให้เลือกดูประวัติวันอื่นได้
                </span>
                <input
                  type="checkbox"
                  checked={allowDate}
                  onChange={(e) => setAllowDate(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded-md focus:ring-amber-400 accent-amber-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Share Link Preview Box */}
          <div className="mb-5 space-y-1.5">
            <label className="text-xs font-bold text-gray-700">ลิงก์สำหรับส่งให้ผู้ฝากขาย</label>
            <div className="flex items-center gap-1.5 bg-amber-50/50 border border-amber-300 rounded-xl p-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs text-gray-700 focus:outline-none select-all truncate font-medium"
              />
              <button
                type="button"
                onClick={handleOpenPreview}
                className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-100/60 rounded-lg transition-colors cursor-pointer shrink-0"
                title="เปิดดูหน้าตัวอย่าง"
              >
                <ExternalLink size={15} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span>ดูตัวอย่าง</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 py-2.5 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isCopied 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25' 
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25'
              }`}
            >
              {isCopied ? <Check size={16} /> : <Copy size={16} />}
              <span>{isCopied ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
