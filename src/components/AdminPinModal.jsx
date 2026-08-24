import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Delete, AlertCircle } from 'lucide-react';
import { verifyAdminPin, getAdminPinLength } from '../services/adminService';
import { vibrateError, vibrateSuccess } from '../utils/haptics';

export default function AdminPinModal({ isOpen, onClose, onSuccess, title = 'ยืนยันรหัส PIN ผู้ดูแลระบบ' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const pinLength = getAdminPinLength();

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setErrorMessage('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleKeyPress = (num) => {
    if (pin.length < pinLength && !loading) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      setErrorMessage('');
      if (newPin.length === pinLength) {
        submitPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !loading) {
      setPin(pin.slice(0, -1));
      setError(false);
      setErrorMessage('');
    }
  };

  const submitPin = async (inputPin) => {
    try {
      setLoading(true);
      const isValid = await verifyAdminPin(inputPin);
      if (isValid) {
        vibrateSuccess();
        onSuccess();
        onClose();
      } else {
        vibrateError();
        setError(true);
        setErrorMessage('รหัส PIN ไม่ถูกต้อง');
        setPin('');
      }
    } catch (err) {
      vibrateError();
      setError(true);
      setErrorMessage('เกิดข้อผิดพลาดในการตรวจสอบ');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-gray-100 flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5 text-amber-700">
              <ShieldCheck size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Security Access</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <h3 className="text-base font-black text-gray-900 text-center mb-1">{title}</h3>
          <p className="text-xs text-gray-500 text-center mb-6">กรุณาใส่รหัส PIN {pinLength} หลักเพื่อดำเนินการ</p>

          {/* PIN Dots Display */}
          <div className="flex gap-2.5 mb-6 justify-center flex-wrap">
            {[...Array(pinLength)].map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-red-500 scale-110'
                    : i < pin.length
                    ? 'bg-amber-600 scale-110'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 text-red-500 text-xs font-medium mb-4"
            >
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num.toString())}
                disabled={loading}
                className="h-12 rounded-2xl bg-gray-50 hover:bg-amber-50 active:bg-amber-100 text-gray-800 text-lg font-black transition-all flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              disabled={loading}
              className="h-12 rounded-2xl bg-gray-50 hover:bg-amber-50 active:bg-amber-100 text-gray-800 text-lg font-black transition-all flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="h-12 rounded-2xl bg-gray-50 hover:bg-red-50 active:bg-red-100 text-gray-600 hover:text-red-600 transition-all flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-30"
            >
              <Delete size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
