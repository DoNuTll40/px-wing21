import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { vibrateWarning } from '../utils/haptics';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  useEffect(() => {
    if (isOpen) vibrateWarning();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-amber-200/80 text-center"
        >
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-200">
              <AlertTriangle size={28} />
            </div>
          </div>
          <h3 className="text-base font-black text-gray-900 mb-1.5">{title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed mb-5 whitespace-pre-line px-2 font-medium">{message}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer"
            >
              ยืนยันการลบ
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
