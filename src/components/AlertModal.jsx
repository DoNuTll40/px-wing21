import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { vibrateError, vibrateWarning, vibrateSuccess } from '../utils/haptics';

export default function AlertModal({ 
  isOpen, 
  type = 'warning', // 'warning' | 'error' | 'success' | 'info'
  title, 
  message, 
  confirmText = 'เข้าใจแล้ว', 
  onClose 
}) {
  useEffect(() => {
    if (isOpen) {
      if (type === 'error') {
        vibrateError();
      } else if (type === 'warning') {
        vibrateWarning();
      } else if (type === 'success') {
        vibrateSuccess();
      } else {
        vibrateWarning();
      }
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const isWarning = type === 'warning';
  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-amber-200/80 overflow-hidden text-center"
        >
          {/* Icon Header */}
          <div className="flex justify-center mb-3">
            <div className={`p-3 rounded-2xl ${
              isError
                ? 'bg-red-50 text-red-600 border border-red-200'
                : isSuccess
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {isError ? (
                <AlertCircle size={28} />
              ) : isSuccess ? (
                <CheckCircle2 size={28} />
              ) : isWarning ? (
                <AlertCircle size={28} className="text-amber-500" />
              ) : (
                <Info size={28} className="text-amber-500" />
              )}
            </div>
          </div>

          {/* Title & Message */}
          <h3 className="text-base font-black text-gray-900 mb-1.5">
            {title || (isError ? 'เกิดข้อผิดพลาด' : 'แจ้งเตือน')}
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed mb-5 whitespace-pre-line px-2 font-medium">
            {message}
          </p>

          {/* Action Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-amber-500/25 transition-all cursor-pointer"
          >
            {confirmText}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
