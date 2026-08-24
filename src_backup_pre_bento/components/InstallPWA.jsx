import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setSupportsPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setSupportsPWA(false);
    }
    setDeferredPrompt(null);
  };

  if (!supportsPWA) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40">
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-slate-700 animate-bounce-short">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-blue-600 rounded-xl text-white shrink-0">
            <Download size={18} />
          </div>
          <div className="text-xs">
            <p className="font-bold">ติดตั้ง PX Report</p>
            <p className="text-gray-400 text-[11px] truncate">เพิ่มลงหน้าจอホームเพื่อใช้งานแบบ App</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-xl text-white shrink-0 transition-colors"
        >
          ติดตั้งเลย
        </button>
      </div>
    </div>
  );
}
