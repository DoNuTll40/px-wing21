import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, ChevronDown, Plus, Trash2 } from 'lucide-react';
import ProductCard from './ProductCard';

export default function SellerAccordion({ 
  seller, 
  products, 
  onProductChange, 
  onDeleteProduct, 
  onDeleteSeller,
  onOpenAddProduct,
  onUpdateSeller,
  onUpdateProduct,
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
      alert(`แก้ไขชื่อไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'}`);
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
    <div className="bg-white border border-gray-200 rounded-2xl mb-3 shadow-xs overflow-hidden">
      {/* Header */}
      <div 
        onClick={() => !isEditingName && setIsOpen(!isOpen)}
        className="flex justify-between items-center px-3 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5 flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
          {/* 🟢 ปุ่ม Grip สำหรับแตะลากสลับลำดับ */}
          <div 
            {...dragHandleProps}
            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none shrink-0"
            title="ลากเพื่อเปลี่ยนลำดับ"
          >
            <GripVertical size={18} />
          </div>

          {!isEditingName && (
            <motion.span 
              onClick={() => setIsOpen(!isOpen)}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400 cursor-pointer shrink-0"
            >
              <ChevronDown size={18} />
            </motion.span>
          )}

          {/* ชื่อผู้ฝากขาย - Inline Edit */}
          {isEditingName ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={name}
                disabled={isSaving}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ width: `${Math.max(name.length, 3) + 2}ch` }}
                className="text-base font-bold text-gray-800 bg-blue-50 border-b-2 border-blue-500 focus:outline-none px-1.5 py-0.5 rounded-t-sm transition-all max-w-[170px] disabled:opacity-50"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isSaving}
                className="bg-green-600 active:bg-green-700 text-white text-xs px-2 py-1 rounded-md shadow-2xs font-bold disabled:opacity-50"
                title="บันทึก"
              >
                {isSaving ? '...' : '✓'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="bg-gray-200 active:bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded-md font-bold disabled:opacity-50"
                title="ยกเลิก"
              >
                ✕
              </button>
            </div>
          ) : (
            <h2 
              onClick={() => setIsEditingName(true)}
              className="font-bold text-gray-800 text-base hover:bg-gray-200/60 px-1.5 py-0.5 rounded transition-colors cursor-pointer truncate max-w-[150px]"
              title="แตะเพื่อแก้ไขชื่อผู้ฝากขาย"
            >
              {seller.name}
            </h2>
          )}

          {!isEditingName && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
              {products.length} รายการ
            </span>
          )}
        </div>

        {!isEditingName && (
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onOpenAddProduct(seller.id)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg active:bg-blue-100"
            >
              <Plus size={14} />
              <span>เพิ่มสินค้า</span>
            </button>
            <button
              onClick={() => onDeleteSeller(seller.id)}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded-md transition-colors"
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
            <div className="p-3 bg-gray-50/50">
              {products.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-3">ยังไม่มีสินค้า กด "+ เพิ่มสินค้า" ด้านบน</p>
              ) : (
                products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onChange={onProductChange}
                    onDelete={onDeleteProduct}
                    onUpdateProduct={onUpdateProduct}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
