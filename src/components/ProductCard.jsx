import React from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ArrowLeftRight, AlertCircle, Trash2, Edit2, Gift } from 'lucide-react';
import { vibrateWarning } from '../utils/haptics';

export default function ProductCard({ product, onChange, onDelete, onEditProduct, onShowAlert }) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const controls = useAnimation();
  const x = useMotionValue(0);

  const deleteOpacity = useTransform(x, [-80, -20], [1, 0]);
  const deleteScale = useTransform(x, [-80, -20], [1, 0.7]);

  // 🔄 ดึงโหมดคำนวณจาก State สินค้า
  const calcMode = product.calc_mode || 'AUTO_REMAIN';

  const sentNum = Number(product.sent) || 0;
  const soldNum = Number(product.sold) || 0;
  const remainNum = Number(product.remain) || 0;

  // สถานะ 1 แถม 1
  const isPromoActive = Boolean(product.is_promo);
  const freeQty = Number(product.free_qty) || 0;
  const promoRemainder = Number(product.promo_remainder) || 0;
  const originalSent = product.original_sent !== undefined && product.original_sent !== null
    ? Number(product.original_sent)
    : sentNum;

  const prevRemain = product.prev_remain !== undefined && product.prev_remain !== null
    ? Number(product.prev_remain)
    : null;

  // 🛑 ตรวจสอบความถูกต้องของตัวเลข
  const maxRemainAllowed = isPromoActive ? (freeQty + promoRemainder) : sentNum;
  const isSoldExceeded = product.sent !== '' && product.sold !== '' && soldNum > sentNum;
  const isRemainExceeded = product.sent !== '' && product.remain !== '' && remainNum > maxRemainAllowed;
  const hasError = isSoldExceeded || isRemainExceeded;

  // 🟢 ฟังก์ชันเปิด/ปิด โปรโมชั่น 1 แถม 1
  const togglePromo = () => {
    if (!isPromoActive) {
      const currentRemain = remainNum;
      if (currentRemain <= 1) {
        if (onShowAlert) {
          onShowAlert('ไม่สามารถจัด 1 แถม 1 ได้', 'สินค้าต้องมียอดเหลือตั้งแต่ 2 ชิ้นขึ้นไป');
        } else {
          alert('สินค้าต้องมียอดเหลือตั้งแต่ 2 ชิ้นขึ้นไป');
        }
        return;
      }

      const promoFree = Math.floor(currentRemain / 2);
      const remainder = currentRemain % 2;
      const newSent = Math.max(0, sentNum - promoFree);
      const newRemain = currentRemain - promoFree;

      onChange(product.id, {
        ...product,
        is_promo: true,
        original_sent: sentNum,
        free_qty: promoFree,
        promo_remainder: remainder,
        sent: newSent,
        remain: newRemain,
        calc_mode: calcMode,
      });
    } else {
      if (remainNum === 0) {
        if (onShowAlert) {
          onShowAlert(
            'ไม่สามารถยกเลิก 1 แถม 1 ได้',
            'สินค้ารายการนี้ขายหมดแล้ว (เหลือ 0) ของแถมถูกแจกจ่ายไปหมดแล้ว หากต้องการปรับยอดให้แก้ไขที่ช่องขายก่อน'
          );
        } else {
          alert('สินค้ารายการนี้ขายหมดแล้ว (เหลือ 0) ไม่สามารถยกเลิกโปรโมชั่นได้');
        }
        return;
      }

      const restoredSent = originalSent;
      const restoredRemain = remainNum + freeQty;

      onChange(product.id, {
        ...product,
        is_promo: false,
        original_sent: null,
        free_qty: 0,
        promo_remainder: 0,
        sent: restoredSent,
        remain: restoredRemain,
        calc_mode: calcMode,
      });
    }
  };

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

  // 🔄 สลับโหมดคำนวณและอัปเดตลง State กลาง
  const toggleCalcMode = () => {
    const nextMode = calcMode === 'AUTO_REMAIN' ? 'AUTO_SELL' : 'AUTO_REMAIN';
    onChange(product.id, {
      ...product,
      calc_mode: nextMode
    });
  };

  // 1. เปลี่ยนช่อง "ส่ง"
  const handleSentChange = (e) => {
    if (isPromoActive) return;
    const val = e.target.value;
    const newSentNum = Number(val) || 0;
    if (calcMode === 'AUTO_REMAIN') {
      const remainVal = val === '' ? '' : Math.max(0, newSentNum - soldNum);
      onChange(product.id, {
        ...product,
        sent: val,
        remain: remainVal,
        is_promo: false,
        original_sent: null,
        free_qty: 0,
        promo_remainder: 0,
        calc_mode: calcMode
      });
    } else {
      const soldVal = val === '' ? '' : Math.max(0, newSentNum - remainNum);
      onChange(product.id, {
        ...product,
        sent: val,
        sold: soldVal,
        is_promo: false,
        original_sent: null,
        free_qty: 0,
        promo_remainder: 0,
        calc_mode: calcMode
      });
    }
  };

  // 2. เปลี่ยนช่อง "ขาย"
  const handleSoldChange = (e) => {
    const val = e.target.value;
    const newSoldNum = Number(val) || 0;
    const remainVal = val === '' && product.sent === '' ? '' : Math.max(0, sentNum - newSoldNum);

    onChange(product.id, {
      ...product,
      sold: val,
      remain: remainVal,
      is_promo: isPromoActive,
      free_qty: freeQty,
      promo_remainder: promoRemainder,
      original_sent: isPromoActive ? originalSent : null,
      calc_mode: calcMode
    });
  };

  // 3. เปลี่ยนช่อง "เหลือ"
  const handleRemainChange = (e) => {
    const val = e.target.value;
    const newRemainNum = Number(val) || 0;
    const soldVal = val === '' && product.sent === '' ? '' : Math.max(0, sentNum - newRemainNum);

    onChange(product.id, {
      ...product,
      remain: val,
      sold: soldVal,
      is_promo: isPromoActive,
      free_qty: freeQty,
      promo_remainder: promoRemainder,
      original_sent: isPromoActive ? originalSent : null,
      calc_mode: calcMode
    });
  };

  // 🏷️ แสดงผลข้อความใต้ช่องเหลือ
  const renderRemainSubtext = () => {
    if (!isPromoActive) return null;

    if (calcMode === 'AUTO_SELL') {
      return (
        <span className="block text-[9px] sm:text-[10px] text-amber-600 font-medium mt-0.5 whitespace-nowrap">
          (จำนวนเหลือ {remainNum} | แถม {freeQty})
        </span>
      );
    } else {
      const originalRemain = remainNum + freeQty;
      const remainder = originalRemain % 2;
      return (
        <span className="block text-[9px] sm:text-[10px] text-amber-600 font-medium mt-0.5 whitespace-nowrap">
          (เดิม {originalRemain}{remainder > 0 ? ` | เศษ ${remainder}` : ''})
        </span>
      );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.92, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-xl mb-2.5 touch-pan-y group"
    >
      {/* พื้นหลังสีแดงฝั่งขวา */}
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

      {/* การ์ดสินค้า */}
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
            : isPromoActive
            ? 'border-amber-400 bg-amber-50/15'
            : 'border-gray-200/90 hover:border-amber-300'
        }`}
      >
        {/* Header Row */}
        <div className="flex justify-between items-center mb-2.5 gap-1.5">
          <div className="flex-1 mr-1 flex items-center gap-1.5 min-w-0">
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

          <div className="flex items-center gap-1.5 shrink-0">
            {/* ปุ่ม 1 แถม 1 */}
            <button
              type="button"
              onClick={togglePromo}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer ${
                isPromoActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-102'
                  : 'bg-gray-50 hover:bg-amber-50 text-gray-500 hover:text-amber-700 border-gray-200 hover:border-amber-300'
              }`}
              title={isPromoActive ? 'แตะเพื่อยกเลิก 1 แถม 1' : 'จัดโปร 1 แถม 1 จากยอดที่เหลือ'}
            >
              <Gift size={11} className={isPromoActive ? 'text-white' : 'text-amber-600'} />
              <span>{isPromoActive ? `1 แถม 1 (แถม ${freeQty})` : '1 แถม 1'}</span>
            </button>

            {prevRemain !== null && (
              <span className="text-[10px] sm:text-[11px] bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full font-medium select-none pointer-events-none">
                เหลือวันก่อน: <strong className="font-bold">{prevRemain}</strong>
              </span>
            )}

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

        {/* Input Grid 7-Columns */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-start text-center">
          {/* ช่องส่ง */}
          <div className="col-span-2">
            <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 mb-1">ส่ง</label>
            <input
              type="number"
              inputMode="numeric"
              value={product.sent ?? ''}
              onChange={handleSentChange}
              onFocus={(e) => e.target.select()}
              disabled={isPromoActive}
              className={`w-full text-center py-2 rounded-xl text-sm font-black border transition-all shadow-2xs ${
                isPromoActive
                  ? 'bg-amber-50/50 border-amber-200 text-gray-700 cursor-not-allowed select-none'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 focus:outline-none'
              }`}
              placeholder="0"
            />
            {isPromoActive && (
              <span className="block text-[9px] sm:text-[10px] text-amber-600 font-medium mt-0.5 whitespace-nowrap">
                (เดิม {originalSent} | แถม {freeQty})
              </span>
            )}
          </div>

          {/* ช่องขาย */}
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
            {isPromoActive && (
              <span className="block text-[9px] sm:text-[10px] text-transparent select-none pointer-events-none mt-0.5">
                -
              </span>
            )}
          </div>

          {/* ปุ่มสลับโหมด ⇆ */}
          <div className="col-span-1 flex justify-center pt-5">
            <button
              type="button"
              onClick={toggleCalcMode}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-700 transition-all active:scale-90 cursor-pointer shadow-2xs"
              title="สลับโหมดคำนวณอัตโนมัติ (ขาย / เหลือ)"
            >
              <ArrowLeftRight size={13} />
            </button>
          </div>

          {/* ช่องเหลือ */}
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
              max={maxRemainAllowed}
              className={`w-full text-center py-2 rounded-xl text-sm font-black border focus:outline-none transition-all shadow-2xs ${
                isRemainExceeded
                  ? 'bg-red-50 border-red-500 text-red-600'
                  : calcMode === 'AUTO_REMAIN'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-800 font-black cursor-default'
                  : 'bg-gray-50 border-gray-200 text-purple-600 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60'
              }`}
              placeholder="0"
            />
            {renderRemainSubtext()}
          </div>
        </div>

        {hasError && (
          <div className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-red-600 bg-red-50 py-1 px-2 rounded-lg">
            <AlertCircle size={14} className="shrink-0" />
            <span>
              {isSoldExceeded 
                ? 'ยอดขายไม่สามารถเกินยอดส่งได้' 
                : isPromoActive 
                  ? `ยอดเหลือต้องไม่เกิน ${maxRemainAllowed} ชิ้น (ของที่นำมาจัด 1 แถม 1)`
                  : 'ยอดเหลือไม่สามารถเกินยอดส่งได้'}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}