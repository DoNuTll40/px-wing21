import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

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
    <aside aria-label="ติดตั้งแอปพลิเคชัน" className="fixed bottom-18 sm:bottom-24 left-3 right-3 max-w-sm mx-auto z-40 select-none">
      <div className="bg-amber-100/40 backdrop-blur-md text-gray-900 px-3 py-2 rounded-2xl shadow-lg flex items-center justify-between gap-2.5 border border-amber-200/80 ring-1 ring-amber-400/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Download size={16} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-gray-900 truncate">ติดตั้ง PX Report</span>
              <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 leading-none">
                APP
              </span>
            </div>
            <p className="text-gray-400 text-[10px] truncate mt-0.5">
              ใช้งานสะดวกรวดเร็วผ่านหน้าจอโฮม
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-[11px] font-bold rounded-xl text-white shadow-2xs transition-all cursor-pointer"
          >
            ติดตั้ง
          </button>
          <button
            type="button"
            onClick={() => setSupportsPWA(false)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
            title="ปิด"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}