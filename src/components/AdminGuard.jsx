import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Unlock, Check, Sparkles } from 'lucide-react';
import AdminPinModal from './AdminPinModal';
import Footer from './Footer';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 วัน
const SESSION_KEY = 'px_admin_session_expiry';

// ✨ Component สร้างละอองกระจายรอบทิศ (Particle Burst)
function ParticleBurst() {
  const particles = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((_, i) => {
        const angle = (i * 360) / particles.length;
        const radian = (angle * Math.PI) / 180;
        const distance = 65 + (i % 3) * 15;
        const x = Math.cos(radian) * distance;
        const y = Math.sin(radian) * distance;

        return (
          <motion.span
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1.4, 0],
              x: x,
              y: y,
              opacity: [1, 0.9, 0],
            }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className={`absolute rounded-full shadow-xs ${
              i % 3 === 0
                ? 'w-2 h-2 bg-amber-400 ring-2 ring-amber-200'
                : i % 2 === 0
                ? 'w-1.5 h-1.5 bg-emerald-400'
                : 'w-2.5 h-2.5 bg-amber-500'
            }`}
          />
        );
      })}
    </div>
  );
}

export default function AdminGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const expiry = localStorage.getItem(SESSION_KEY);
      if (!expiry) return false;
      if (Date.now() < Number(expiry)) return true;
      localStorage.removeItem(SESSION_KEY);
      return false;
    } catch {
      return false;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(!isAuthenticated);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleSuccess = () => {
    const expiryTime = Date.now() + SESSION_DURATION_MS;
    localStorage.setItem(SESSION_KEY, expiryTime.toString());

    // ปิด Modal PIN แล้วเข้าสู่โหมดแอนิเมชันปลดล็อก
    setIsModalOpen(false);
    setIsUnlocking(true);

    // หน่วงเวลา 900ms เพื่อให้เล่น Animation ครบทุกจังหวะ
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsUnlocking(false);
    }, 900);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fffdf7] flex flex-col justify-between p-4 sm:p-6 font-sans select-none relative overflow-hidden">
        {/* Header Bar */}
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Store size={16} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-tight">PX Daily Report</h1>
              <span className="text-[10px] text-amber-800 font-medium block">ระบบรายงานยอดขายประจำวัน</span>
            </div>
          </div>
        </div>

        {/* 🌟 Kinetic Unlock Morph Sequence */}
        <AnimatePresence>
          {isUnlocking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/10 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.08, filter: 'blur(6px)' }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border-2 border-amber-300 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-amber-500/15 flex flex-col items-center gap-4 text-center max-w-xs w-full relative overflow-visible"
              >
                {/* ละอองประกายกระจายตัว */}
                <ParticleBurst />

                {/* วงแหวนกระจายคลื่นความถี่ (Pulse Ring) */}
                <div className="relative flex items-center justify-center my-1">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute w-16 h-16 rounded-3xl bg-amber-400/30 pointer-events-none"
                  />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.7, opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.15, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute w-16 h-16 rounded-3xl bg-emerald-400/30 pointer-events-none"
                  />

                  {/* กล่องไอคอนปลดล็อก + สลับเป็นติ๊กถูก */}
                  <motion.div
                    initial={{ scale: 0, rotate: -35 }}
                    animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                    transition={{ duration: 0.45, ease: 'backOut' }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 relative z-10"
                  >
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.25 }}
                    >
                      <Unlock size={30} className="stroke-[2.5]" />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-xs z-20"
                  >
                    <Check size={12} className="stroke-[3]" />
                  </motion.div>

                  <Sparkles size={18} className="absolute -bottom-2 -left-2 text-amber-500 animate-pulse z-20" />
                </div>

                <div className="space-y-1 z-10">
                  <motion.h3
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-base font-black text-gray-900 tracking-tight"
                  >
                    ยินดีต้อนรับสู่ระบบ
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="text-xs font-bold text-amber-800/80"
                  >
                    กำลังพาเข้าสู่ระบบหลัก...
                  </motion.p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal PIN */}
        <AdminPinModal
          isOpen={isModalOpen}
          onClose={null}
          onSuccess={handleSuccess}
        />

        {/* Footer */}
        <div className="pb-4 px-2 z-10">
          <Footer title="PX Daily Report System • ปลอดภัยด้วยระบบเข้ารหัส PIN " />
        </div>
      </div>
    );
  }

  return children;
}