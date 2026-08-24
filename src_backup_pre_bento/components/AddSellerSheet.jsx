import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddSellerSheet({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">เพิ่มผู้ฝากขาย</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อผู้ฝากขาย / ยศ-ชื่อ</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น จ่านุ, จ่าป้อ"
                className="w-full h-11 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-sm text-white bg-blue-600 rounded-xl font-medium"
              >
                บันทึก
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
