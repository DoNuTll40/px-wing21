import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, ChevronDown, Plus, Trash2, Edit2, Share2 } from 'lucide-react';
import ProductCard from './ProductCard';

export default function SellerAccordion({ 
  seller, 
  products = [], 
  onProductChange, 
  onDeleteProduct, 
  onDeleteSeller, 
  onOpenAddProduct, 
  onUpdateSeller, 
  onEditProduct,
  onShareSeller,
  dragHandleProps 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(seller.name || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(seller.name || '');
  }, [seller.name]);

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === seller.name) {
      setName(seller.name || '');
      setIsEditingName(false);
      return;
    }

    try {
      setIsSaving(true);
      await onUpdateSeller(seller.id, trimmed);
      setIsEditingName(false);
    } catch (err) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(seller.name || '');
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
    <div className="bg-white border border-gray-200/90 hover:border-amber-300 rounded-2xl mb-3 shadow-2xs transition-all overflow-hidden group/seller">
      {/* Header Bar */}
      <div 
        onClick={() => !isEditingName && setIsOpen(!isOpen)}
        className="flex justify-between items-center px-3.5 py-3 bg-gray-50/90 hover:bg-amber-50/30 border-b border-gray-100 cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-1.5 flex-1 mr-2 min-w-0" onClick={(e) => e.stopPropagation()}>
          {/* 🟢 ปุ่ม Grip สำหรับแตะลากสลับลำดับ */}
          <div 
            {...dragHandleProps}
            className="p-1 text-gray-400 hover:text-amber-600 cursor-grab active:cursor-grabbing touch-none shrink-0"
            title="ลากเพื่อเปลี่ยนลำดับ"
          >
            <GripVertical size={18} />
          </div>

          {/* ลูกศรเปิด/ปิด Accordion */}
          {!isEditingName && (
            <motion.span 
              onClick={() => setIsOpen(!isOpen)}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400 hover:text-amber-600 p-0.5 cursor-pointer shrink-0"
              title="เปิด/ปิดรายการสินค้า"
            >
              <ChevronDown size={18} />
            </motion.span>
          )}

          {/* ชื่อผู้ฝากขาย - แตะที่ชื่อเพื่อแก้ไข Inline Edit ได้ทันที */}
          {isEditingName ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={name}
                disabled={isSaving}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ width: `${Math.max(name.length, 4) + 3}ch` }}
                className="text-base font-extrabold text-gray-800 bg-amber-50 border-b-2 border-amber-500 focus:outline-none px-2 py-0.5 rounded-t-sm transition-all max-w-[200px] disabled:opacity-50"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isSaving}
                className="bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 rounded-md shadow-2xs font-bold disabled:opacity-50 cursor-pointer"
                title="บันทึก"
              >
                {isSaving ? '...' : '✓'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="bg-gray-200 active:bg-gray-300 hover:bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded-md font-bold disabled:opacity-50 cursor-pointer"
                title="ยกเลิก"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 
                onClick={() => setIsEditingName(true)}
                className="font-extrabold text-gray-800 text-sm sm:text-base hover:text-amber-700 transition-colors cursor-pointer"
                title="แตะเพื่อแก้ไขชื่อผู้ฝากขาย"
              >
                {seller.name}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-gray-300 hover:text-amber-600 p-0.5 rounded opacity-0 group-hover/seller:opacity-100 transition-opacity cursor-pointer hidden sm:inline-block shrink-0"
                title="แก้ไขชื่อผู้ฝากขาย"
              >
                <Edit2 size={13} />
              </button>
            </div>
          )}

          {!isEditingName && (
            <span className="text-[11px] font-semibold bg-gray-200/80 text-gray-700 px-2 py-0.5 rounded-full shrink-0">
              {products.length} รายการ
            </span>
          )}
        </div>

        {/* ฝั่งขวา: ปุ่มแชร์, เพิ่มสินค้า และ ลบร้านค้า */}
        {!isEditingName && (
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onShareSeller && onShareSeller(seller)}
              className="text-amber-800 hover:text-amber-900 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/70 p-1.5 rounded-xl active:scale-95 transition-all cursor-pointer"
              title="แชร์รายงานยอดขายให้ผู้ฝาก"
            >
              <Share2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => onOpenAddProduct(seller.id)}
              className="text-xs text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/70 px-2.5 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>เพิ่มสินค้า</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteSeller(seller.id)}
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="ลบผู้ฝากขาย"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-amber-50/15 space-y-2">
              {products.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-4">ยังไม่มีสินค้า กด "+ เพิ่มสินค้า" ด้านบน</p>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onChange={onProductChange}
                      onDelete={onDeleteProduct}
                      onEditProduct={onEditProduct}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
