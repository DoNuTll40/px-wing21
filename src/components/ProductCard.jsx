import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ArrowLeftRight, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { vibrateWarning } from '../utils/haptics';

export default function ProductCard({ product, onChange, onDelete, onEditProduct }) {
  const [calcMode, setCalcMode] = useState('AUTO_REMAIN');
  const [isDeleting, setIsDeleting] = useState(false);

  const controls = useAnimation();
  const x = useMotionValue(0);

  const deleteOpacity = useTransform(x, [-80, -20], [1, 0]);
  const deleteScale = useTransform(x, [-80, -20], [1, 0.7]);

  const sentNum = Number(product.sent) || 0;
  const soldNum = Number(product.sold) || 0;
  const remainNum = Number(product.remain) || 0;

  const prevRemain = product.prev_remain !== undefined && product.prev_remain !== null 
    ? Number(product.prev_remain) 
    : null;

  const isSoldExceeded = product.sent !== '' && product.sold !== '' && soldNum > sentNum;
  const isRemainExceeded = product.sent !== '' && product.remain !== '' && remainNum > sentNum;
  const hasError = isSoldExceeded || isRemainExceeded;

  // ทำการลบสินค้าทันทีพร้อม animation
  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    vibrateWarning();
    await controls.start({
      x: -300,
      opacity: 0,
      transition: { duration: 0.22, ease: 'easeOut' }
    });
    if (onDelete) {
      const success = await onDelete(product.id);
      // หากลบไม่สำเร็จ (เช่น ติดประวัติรายงานย้อนหลัง) ให้เด้งกลับมาแสดงตามเดิม
      if (!success) {
        controls.start({ x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } });
      }
    }
    setIsDeleting(false);
  };

  const handleDragEnd = async (_, info) => {
    if (info.offset.x < -70 || info.velocity.x < -400) {
      handleDelete();
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 35 } });
    }
  };

  const toggleCalcMode = () => {
    setCalcMode((prev) => (prev === 'AUTO_REMAIN' ? 'AUTO_SELL' : 'AUTO_REMAIN'));
    onChange(product.id, { ...product, sold: '', remain: '' });
  };

  const handleSentChange = (e) => {
    const val = e.target.value;
    const newSentNum = Number(val) || 0;
    if (calcMode === 'AUTO_REMAIN') {
      const remainVal = val === '' ? '' : Math.max(0, newSentNum - soldNum);
      onChange(product.id, { ...product, sent: val, remain: remainVal });
    } else {
      const soldVal = val === '' ? '' : Math.max(0, newSentNum - remainNum);
      onChange(product.id, { ...product, sent: val, sold: soldVal });
    }
  };

  const handleSoldChange = (e) => {
    const val = e.target.value;
    const newSoldNum = Number(val) || 0;
    const remainVal = val === '' && product.sent === '' ? '' : Math.max(0, sentNum - newSoldNum);
    onChange(product.id, { ...product, sold: val, remain: remainVal });
  };

  const handleRemainChange = (e) => {
    const val = e.target.value;
    const newRemainNum = Number(val) || 0;
    const soldVal = val === '' && product.sent === '' ? '' : Math.max(0, sentNum - newRemainNum);
    onChange(product.id, { ...product, remain: val, sold: soldVal });
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.92, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-xl mb-2.5 touch-pan-y group"
    >
      {/* พื้นหลังสีแดงฝั่งขวา (ปุ่มลบเมื่อรูดบนมือถือ) */}
      <div 
        onClick={handleDelete}
        className="absolute inset-y-0 right-0 w-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-end pr-5 rounded-xl text-white font-medium cursor-pointer select-none transition-colors"
      >
        <motion.div 
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="flex items-center gap-1.5 text-xs font-bold"
        >
          <Trash2 size={16} />
          <span>ลบ</span>
        </motion.div>
      </div>

      {/* ตัวการ์ดสินค้า (Warm Amber Theme) */}
      <motion.div
        animate={controls}
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        className={`relative z-10 bg-white p-3 sm:p-3.5 border shadow-2xs rounded-xl transition-colors ${
          hasError 
            ? 'border-red-300 bg-red-50/20' 
            : 'border-gray-200/90 hover:border-amber-300'
        }`}
      >
        {/* Header Row: ชื่อสินค้า + หน่วยนับ + ยอดยกมา */}
        <div className="flex justify-between items-center mb-2.5">
          {/* ชื่อสินค้า - แตะเพื่อเปิดแผงแก้ไขสินค้า */}
          <div className="flex-1 mr-2 flex items-center gap-1.5 min-w-0">
            <span
              onClick={() => onEditProduct && onEditProduct(product)}
              className="font-bold text-gray-800 text-xs sm:text-sm cursor-pointer hover:text-amber-700 px-1 py-0.5 rounded transition-colors inline-block truncate"
              title="แตะเพื่อแก้ไขชื่อสินค้าและหน่วยนับ"
            >
              {product.name}
            </span>
            <button
              type="button"
              onClick={() => onEditProduct && onEditProduct(product)}
              className="text-gray-300 hover:text-amber-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden sm:inline-block shrink-0"
              title="แก้ไขชื่อสินค้าและหน่วยนับ"
            >
              <Edit2 size={12} />
            </button>
          </div>

          {/* ด้านขวา: ยอดยกมาจากวันก่อน + หน่วยนับ + ปุ่มลบสำหรับ PC */}
          <div className="flex items-center gap-1.5 shrink-0">
            {prevRemain !== null && (
              <span className="text-[10px] sm:text-[11px] bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full font-medium select-none pointer-events-none">
                เหลือวันก่อน: <strong className="font-bold">{prevRemain}</strong>
              </span>
            )}

            {/* แตะที่ Badge หน่วยนับเพื่อเปิดแผงแก้ไข */}
            <button
              type="button"
              onClick={() => onEditProduct && onEditProduct(product)}
              className="text-[11px] text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 font-bold transition-colors cursor-pointer"
              title="แตะเพื่อแก้ไขหน่วยนับ"
            >
              {product.unit || 'ชิ้น'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="hidden sm:flex items-center justify-center p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              title="ลบสินค้ารายการนี้"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Input Grid 7-Columns (Warm Golden Input Border) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-center text-center">
          {/* ส่ง */}
          <div className="col-span-2">
            <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 mb-1">ส่ง</label>
            <input
              type="number"
              inputMode="numeric"
              value={product.sent ?? ''}
              onChange={handleSentChange}
              onFocus={(e) => e.target.select()}
              className="w-full text-center py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 focus:outline-none transition-all shadow-2xs"
              placeholder="0"
            />
          </div>

          {/* ขาย */}
          <div className="col-span-2">
            <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 mb-1">
              ขาย {calcMode === 'AUTO_SELL' && <span className="text-amber-600 font-extrabold">(Auto)</span>}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={product.sold ?? ''}
              onChange={handleSoldChange}
              onFocus={(e) => e.target.select()}
              readOnly={calcMode === 'AUTO_SELL'}
              className={`w-full text-center py-2 rounded-xl text-sm font-black border focus:outline-none transition-all shadow-2xs ${
                isSoldExceeded
                  ? 'bg-red-50 border-red-500 text-red-600'
                  : calcMode === 'AUTO_SELL'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-800 font-black cursor-default'
                  : 'bg-gray-50 border-gray-200 text-emerald-600 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60'
              }`}
              placeholder="0"
            />
          </div>

          {/* ปุ่มสลับโหมด */}
          <div className="col-span-1 flex justify-center pt-3.5 sm:pt-4">
            <button
              type="button"
              onClick={toggleCalcMode}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-700 transition-all active:scale-90 cursor-pointer shadow-2xs"
              title="สลับโหมดคำนวณอัตโนมัติ (ขาย / เหลือ)"
            >
              <ArrowLeftRight size={13} />
            </button>
          </div>

          {/* เหลือ */}
          <div className="col-span-2">
            <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 mb-1">
              เหลือ {calcMode === 'AUTO_REMAIN' && <span className="text-amber-600 font-extrabold">(Auto)</span>}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={product.remain ?? ''}
              onChange={handleRemainChange}
              onFocus={(e) => e.target.select()}
              readOnly={calcMode === 'AUTO_REMAIN'}
              className={`w-full text-center py-2 rounded-xl text-sm font-black border focus:outline-none transition-all shadow-2xs ${
                isRemainExceeded
                  ? 'bg-red-50 border-red-500 text-red-600'
                  : calcMode === 'AUTO_REMAIN'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-800 font-black cursor-default'
                  : 'bg-gray-50 border-gray-200 text-purple-600 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60'
              }`}
              placeholder="0"
            />
          </div>
        </div>

        {hasError && (
          <div className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-red-600 bg-red-50 py-1 px-2 rounded-lg">
            <AlertCircle size={14} className="shrink-0" />
            <span>{isSoldExceeded ? 'ยอดขายไม่สามารถเกินยอดส่งได้' : 'ยอดเหลือไม่สามารถเกินยอดส่งได้'}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
