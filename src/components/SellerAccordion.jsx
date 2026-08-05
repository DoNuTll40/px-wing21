import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { GripVertical, ChevronDown, Trash2 } from 'lucide-react';

export default function SellerAccordion({
  seller,
  products,
  onProductChange,
  onDeleteProduct,
  onDeleteSeller,
  onOpenAddProduct,
  dragHandleProps
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header ของ Accordion */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3.5 cursor-pointer select-none bg-white hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
          {/* Grip Icon สำหรับ Drag & Drop */}
          <div
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
            title="กดค้างเพื่อลากสลับลำดับ"
          >
            <GripVertical size={18} />
          </div>

          <span className={`text-gray-400 text-xs transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={16} />
          </span>

          <h3 className="font-bold text-gray-800 text-sm truncate">
            {seller.name}
          </h3>

          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
            {products.length} รายการ
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onOpenAddProduct(seller.id)}
            className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl transition-colors"
          >
            + เพิ่มสินค้า
          </button>
          <button
            type="button"
            onClick={() => onDeleteSeller(seller.id)}
            className="p-1.5 text-red-400 hover:text-red-500 rounded-lg transition-colors"
            title="ลบผู้ฝากขาย"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* 🟢 ส่วนเนื้อหาพร้อม Animation ยุบขยาย และ Exit Animation เมื่อลบสินค้า */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden bg-gray-50/30 border-t border-gray-50"
          >
            <div className="p-3 pt-1 space-y-2">
              {products.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-3">ยังไม่มีรายการสินค้า</p>
              ) : (
                /* 🟢 ครอบ AnimatePresence ที่รายการสินค้า เพื่อให้สินค้าลบแบบลื่นๆ */
                <AnimatePresence mode="popLayout">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      layout // ทำให้รายการอื่นเขยิบขึ้นมาแบบลื่นไหล
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ 
                        opacity: 0, 
                        x: -120, // สไลด์ไปทางซ้ายตามทิศทางที่ปัดลบ
                        height: 0, 
                        marginBottom: 0,
                        transition: { duration: 0.22, ease: 'easeOut' } 
                      }}
                    >
                      <ProductCard
                        product={product}
                        onChange={onProductChange}
                        onDelete={onDeleteProduct}
                      />
                    </motion.div>
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
