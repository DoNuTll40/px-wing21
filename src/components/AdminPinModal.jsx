import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Delete, AlertCircle, Lock, Timer } from 'lucide-react';
import { verifyAdminPin, getAdminPinLength } from '../services/adminService';
import { vibrateError, vibrateKeyClick, vibrateKeyDelete, vibrateSuccess } from '../utils/haptics';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 นาที
const LOCKOUT_KEY = 'px_admin_lockout_until';
const ATTEMPTS_KEY = 'px_admin_failed_attempts';

export default function AdminPinModal({ isOpen, onClose, onSuccess, title = 'ยืนยันรหัส PIN ผู้ดูแลระบบ' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const pinLength = getAdminPinLength();

  // ⏱️ ตรวจสอบสถานะการบล็อกเวลาเปิด Modal หรือมี Lockout
  useEffect(() => {
    const checkLockout = () => {
      const lockUntil = Number(localStorage.getItem(LOCKOUT_KEY)) || 0;
      const now = Date.now();
      if (lockUntil > now) {
        setLockoutRemaining(Math.ceil((lockUntil - now) / 1000));
      } else {
        setLockoutRemaining(0);
        localStorage.removeItem(LOCKOUT_KEY);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setErrorMessage('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleKeyPress = (num) => {
    if (lockoutRemaining > 0) return;
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
    if (lockoutRemaining > 0) return;
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
        // ล้างประวัติการใส่ผิด
        localStorage.removeItem(ATTEMPTS_KEY);
        localStorage.removeItem(LOCKOUT_KEY);
        onSuccess();
        if (onClose) onClose();
      } else {
        vibrateError();
        const currentAttempts = (Number(localStorage.getItem(ATTEMPTS_KEY)) || 0) + 1;
        localStorage.setItem(ATTEMPTS_KEY, currentAttempts.toString());

        if (currentAttempts >= MAX_ATTEMPTS) {
          const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
          localStorage.setItem(LOCKOUT_KEY, lockUntil.toString());
          localStorage.removeItem(ATTEMPTS_KEY);
          setLockoutRemaining(300);
          setErrorMessage('ใส่รหัสผิดเกิน 5 ครั้ง บล็อกการใช้งาน 5 นาที');
        } else {
          setError(true);
          setErrorMessage(`รหัส PIN ไม่ถูกต้อง (เหลือโอกาส ${MAX_ATTEMPTS - currentAttempts} ครั้ง)`);
        }
        setPin('');
      }
    } catch (err) {
      console.error('Failed to verify admin pin:', err);
      vibrateError();
      setError(true);
      setErrorMessage('เกิดข้อผิดพลาดในการตรวจสอบ');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // จัดรูปแบบเวลานับถอยหลัง MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLocked = lockoutRemaining > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-xxs select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={
            error
              ? { scale: 1, opacity: 1, x: [-10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.35 } }
              : { scale: 1, opacity: 1, x: 0 }
          }
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-7 max-w-xs w-full shadow-2xl border border-amber-200/80 flex flex-col items-center relative overflow-hidden"
        >
          {/* Header */}
          <div className="w-full flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5 text-amber-700">
              <ShieldCheck size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Security Access</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <h3 className="text-base font-black text-gray-900 text-center mb-1">{title}</h3>
          <p className="text-xs text-gray-500 text-center mb-6">
            {isLocked ? 'ระบบถูกระงับชั่วคราวเพื่อความปลอดภัย' : `กรุณาใส่รหัส PIN ${pinLength} หลักเพื่อดำเนินการ`}
          </p>

          {/* PIN Dots Display หรือ Lockout Counter */}
          {isLocked ? (
            <div className="flex flex-col items-center justify-center mb-6 py-3 px-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 w-full">
              <Timer size={24} className="mb-1" />
              <span className="text-xl font-black tracking-widest">{formatTime(lockoutRemaining)}</span>
              <span className="text-[10px] font-bold text-rose-500 mt-0.5">กรุณารอก่อนลองใหม่อีกครั้ง</span>
            </div>
          ) : (
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
          )}

          {/* Error Message */}
          {error && !isLocked && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 text-red-500 text-xs font-bold mb-4 bg-red-50 px-2.5 py-1 rounded-xl"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-60">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onPointerDown={() => {
                  handleKeyPress(num.toString());
                  vibrateKeyClick();
                }}
                disabled={loading || isLocked}
                className="h-12 rounded-2xl bg-gray-50 hover:bg-amber-50 active:bg-amber-100 text-gray-800
                text-lg font-black transition-all flex items-center justify-center cursor-pointer active:scale-95
                 disabled:opacity-30 disabled:pointer-events-none
                 drop-shadow-sm hover:drop-shadow-md active:drop-shadow-none"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onPointerDown={() => {
                handleKeyPress('0');
                vibrateKeyClick();
              }}
              disabled={loading || isLocked}
              className="h-12 rounded-2xl bg-gray-50 hover:bg-amber-50 active:bg-amber-100 text-gray-800
              text-lg font-black transition-all flex items-center justify-center cursor-pointer active:scale-95
              disabled:opacity-30 disabled:pointer-events-none
              drop-shadow-sm hover:drop-shadow-md active:drop-shadow-none"
            >
              0
            </button>
            <button
              type="button"
              onPointerDown={() => {
                handleDelete();
                vibrateKeyDelete();
              }}
              disabled={loading || pin.length === 0 || isLocked}
              className="h-12 rounded-2xl bg-gray-50 hover:bg-red-50 active:bg-red-100 text-gray-600
              hover:text-red-600 transition-all flex items-center justify-center cursor-pointer active:scale-95
              disabled:opacity-30 disabled:pointer-events-none
              drop-shadow-sm hover:drop-shadow-md active:drop-shadow-none"
            >
              <Delete size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}