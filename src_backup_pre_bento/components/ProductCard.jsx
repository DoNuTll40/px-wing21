import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowLeftRight, AlertCircle, Trash2, Edit2 } from 'lucide-react';

export default function ProductCard({ product, onChange, onDelete, onUpdateProduct }) {
  const [calcMode, setCalcMode] = useState('AUTO_REMAIN');
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(product.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const x = useMotionValue(0);

  // เปลี่ยน opacity และ scale ของปุ่มลบด้านหลังตามระยะสไลด์ (Mobile swipe)
  const deleteOpacity = useTransform(x, [-120, -40], [1, 0.3]);
  const deleteScale = useTransform(x, [-120, -40], [1.1, 0.8]);

  useEffect(() => {
    setName(product.name || '');
  }, [product.name]);

  const sentNum = Number(product.sent) || 0;
  const soldNum = Number(product.sold) || 0;
  const remainNum = Number(product.remain) || 0;

  const prevRemain = product.prev_remain !== undefined && product.prev_remain !== null 
    ? Number(product.prev_remain) 
    : null;

  const isSoldExceeded = product.sent !== '' && product.sold !== '' && soldNum > sentNum;
  const isRemainExceeded = product.sent !== '' && product.remain !== '' && remainNum > sentNum;
  const hasError = isSoldExceeded || isRemainExceeded;

  // ตรวจสอบระยะเมื่อปล่อยมือ (Drag End บน Mobile)
  const handleDragEnd = (_, info) => {
    if (info.offset.x < -100) {
      if (onDelete) onDelete(product.id);
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

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === product.name) {
      setName(product.name || '');
      setIsEditingName(false);
      return;
    }

    try {
      setIsSaving(true);
      if (onUpdateProduct) {
        await onUpdateProduct(product.id, trimmed, product.unit || 'ชิ้น');
      }
      setIsEditingName(false);
    } catch (err) {
      alert(`แก้ไขชื่อสินค้าไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(product.name || '');
    setIsEditingName(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-3 touch-pan-y group">
      {/* พื้นหลังสีแดงฝั่งขวา (แสดงสัญลักษณ์การลบเมื่อ Swipe บน Touch Screen) */}
      <div className="absolute inset-y-0 right-0 w-full bg-red-500 flex items-center justify-end pr-6 rounded-xl text-white font-medium">
        <motion.div 
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="flex items-center gap-1.5 text-xs font-semibold"
        >
          <Trash2 size={18} />
          <span>ลบรายการนี้</span>
        </motion.div>
      </div>

      {/* ตัว Card สินค้าที่ลากได้ */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragSnapToOrigin={true}
        dragElastic={{ left: 0.2, right: 0 }}
        onDragEnd={handleDragEnd}
        className={`relative z-10 bg-white p-3.5 border shadow-2xs rounded-xl transition-all ${
          hasError ? 'border-red-300 bg-red-50/20' : 'border-gray-200/90 hover:border-gray-300 hover:shadow-xs'
        }`}
      >
        <div className="flex justify-between items-center mb-2.5">
          {/* ชื่อสินค้า - แตะเพื่อแก้ไข Inline Edit */}
          <div className="flex-1 mr-2 flex items-center gap-1.5">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={name}
                  disabled={isSaving}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ width: `${Math.max(name.length, 4) + 3}ch` }}
                  className="text-sm font-bold text-gray-800 bg-blue-50 border-b-2 border-blue-500 focus:outline-none px-2 py-0.5 rounded-t-sm transition-all max-w-[200px] disabled:opacity-50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="bg-green-600 active:bg-green-700 hover:bg-green-700 text-white text-[11px] px-2 py-1 rounded-md shadow-2xs font-bold disabled:opacity-50 cursor-pointer"
                  title="บันทึก"
                >
                  {isSaving ? '...' : '✓'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="bg-gray-200 active:bg-gray-300 hover:bg-gray-300 text-gray-700 text-[11px] px-2 py-1 rounded-md font-bold disabled:opacity-50 cursor-pointer"
                  title="ยกเลิก"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span
                  onClick={() => setIsEditingName(true)}
                  className="font-bold text-gray-800 text-sm cursor-pointer hover:text-blue-600 px-1 py-0.5 rounded transition-colors inline-block"
                  title="คลิกเพื่อแก้ไขชื่อสินค้า"
                >
                  {product.name}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-gray-300 hover:text-blue-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden sm:inline-block"
                  title="แก้ไขชื่อสินค้า"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </div>

          {/* ด้านขวา: ยอดยกมาจากวันก่อน + หน่วยนับ + ปุ่มลบสำหรับ PC (Mouse Hover) */}
          {!isEditingName && (
            <div className="flex items-center gap-1.5 shrink-0">
              {prevRemain !== null && (
                <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full font-medium select-none pointer-events-none">
                  เหลือวันก่อน: <strong className="font-bold">{prevRemain}</strong>
                </span>
              )}

              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                {product.unit || 'ชิ้น'}
              </span>

              {/* ปุ่มลบแบบคลิกโดยตรงสำหรับเมาส์บน PC */}
              <button
                type="button"
                onClick={() => onDelete && onDelete(product.id)}
                className="hidden sm:flex items-center justify-center p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="ลบสินค้ารายการนี้"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Input Grid 7-Columns */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-center text-center">
          {/* ส่ง */}
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-gray-400 mb-1">ส่ง</label>
            <input
              type="number"
              inputMode="numeric"
              value={product.sent ?? ''}
              onChange={handleSentChange}
              onFocus={(e) => e.target.select()}
              className="w-full text-center py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
              placeholder="0"
            />
          </div>

          {/* ขาย */}
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-gray-400 mb-1">
              ขาย {calcMode === 'AUTO_SELL' && <span className="text-blue-500 font-bold">(คำนวณ)</span>}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={product.sold ?? ''}
              onChange={handleSoldChange}
              onFocus={(e) => e.target.select()}
              readOnly={calcMode === 'AUTO_SELL'}
              className={`w-full text-center py-2 rounded-lg text-sm font-bold border focus:outline-none transition-all ${
                isSoldExceeded
                  ? 'bg-red-50 border-red-500 text-red-600'
                  : calcMode === 'AUTO_SELL'
                  ? 'bg-blue-50/60 border-blue-200 text-blue-600 font-extrabold cursor-default'
                  : 'bg-gray-50/80 border-gray-200 text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              }`}
              placeholder="0"
            />
          </div>

          {/* ปุ่มสลับโหมด */}
          <div className="col-span-1 flex justify-center pt-4">
            <button
              type="button"
              onClick={toggleCalcMode}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-all active:scale-90 cursor-pointer shadow-2xs"
              title="สลับโหมดคำนวณอัตโนมัติ (ขาย / เหลือ)"
            >
              <ArrowLeftRight size={14} />
            </button>
          </div>

          {/* เหลือ */}
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-gray-400 mb-1">
              เหลือ {calcMode === 'AUTO_REMAIN' && <span className="text-blue-500 font-bold">(คำนวณ)</span>}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={product.remain ?? ''}
              onChange={handleRemainChange}
              onFocus={(e) => e.target.select()}
              readOnly={calcMode === 'AUTO_REMAIN'}
              className={`w-full text-center py-2 rounded-lg text-sm font-bold border focus:outline-none transition-all ${
                isRemainExceeded
                  ? 'bg-red-50 border-red-500 text-red-600'
                  : calcMode === 'AUTO_REMAIN'
                  ? 'bg-blue-50/60 border-blue-200 text-blue-600 font-extrabold cursor-default'
                  : 'bg-gray-50/80 border-gray-200 text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              }`}
              placeholder="0"
            />
          </div>
        </div>

        {hasError && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-red-600 bg-red-50 py-1.5 px-2 rounded-lg border border-red-100">
            <AlertCircle size={14} className="shrink-0" />
            <span>{isSoldExceeded ? 'ยอดขายไม่สามารถเกินยอดส่งได้' : 'ยอดเหลือไม่สามารถเกินยอดส่งได้'}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

