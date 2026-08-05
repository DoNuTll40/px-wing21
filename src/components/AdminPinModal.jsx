import React, { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

export default function AdminPinModal({ isOpen, onClose, onSuccess }) {
  const envPin = import.meta.env.VITE_ADMIN_PIN || '1234';
  const pinLength = envPin.length;

  const [pin, setPin] = useState(Array(pinLength).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setPin(Array(pinLength).fill(''));
      setError('');
      setLoading(false);
      setTimeout(() => {
        if (inputRef.current[0]) inputRef.current[0].focus();
      }, 100);
    }
  }, [isOpen, pinLength]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    if (value && index < pinLength - 1) {
      inputRef.current[index + 1]?.focus();
    }

    const currentPinStr = newPin.join('');
    if (currentPinStr.length === pinLength) {
      verifyPin(currentPinStr);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRef.current[index - 1]?.focus();
    }
  };

  const verifyPin = (pinValue) => {
    setLoading(true);
    
    if (pinValue === envPin) {
      setTimeout(() => {
        setLoading(false);
        onSuccess();
      }, 200);
    } else {
      setTimeout(() => {
        setLoading(false);
        setError('รหัส PIN ไม่ถูกต้อง');
        setPin(Array(pinLength).fill(''));
        inputRef.current[0]?.focus();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      {/* 🟢 ปรับ max-w ให้ขยายตามจำนวน PIN (ถ้ายาวมากจะปรับใช้ max-w-sm/md) */}
      <div className={`w-full ${pinLength > 6 ? 'max-w-md' : 'max-w-xs'} bg-white rounded-3xl p-6 shadow-2xl text-center border border-gray-100 transition-all`}>
        
        {/* Header Icon */}
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Lock size={22} />
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1">
          ยืนยันสิทธิ์ Admin
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          กรอกรหัส PIN {pinLength} หลักเพื่อยืนยันการลบประวัติ
        </p>

        {/* 🟢 ยืดหดความกว้างอัตโนมัติ (flex-1) พร้อมใส่ gap ที่เหมาะสม ไม่ล้นขอบ */}
        <div className="flex justify-center items-center gap-1.5 sm:gap-2 mb-4 w-full overflow-x-auto py-1">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRef.current[idx] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={loading}
              className={`flex-1 min-w-[32px] max-w-[44px] h-12 sm:h-13 text-center text-lg sm:text-xl font-bold rounded-xl sm:rounded-2xl border-2 transition-all outline-none ${
                error
                  ? 'border-red-400 bg-red-50/50 text-red-600'
                  : digit
                  ? 'border-blue-600 bg-blue-50/30 text-blue-900'
                  : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error ? (
          <p className="text-xs font-semibold text-red-500 mb-4">
            {error}
          </p>
        ) : (
          <div className="h-5 mb-3" />
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-xl transition-all"
          >
            ยกเลิก
          </button>
        </div>

      </div>
    </div>
  );
}
