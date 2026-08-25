import React from 'react';
import { History, Plus, Bug, BarChart3 } from 'lucide-react';

export default function Header({ 
  onOpenAddSeller, 
  isDebugOpen, 
  onToggleDebug, 
  onOpenHistory,
  onOpenDashboard 
}) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-amber-200/60 px-3 sm:px-6 py-2.5 shadow-2xs">
      <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto flex justify-between items-center gap-1.5">
        {/* Brand Left */}
        <div className="flex items-center gap-1.5 shrink-0">
          <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight whitespace-nowrap">
            PX Daily Report
          </h1>
          <button
            type="button"
            onClick={onToggleDebug}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold transition-all flex items-center gap-0.5 shrink-0 cursor-pointer ${
              isDebugOpen ? 'bg-amber-400 text-slate-900 shadow-2xs' : 'bg-amber-100/70 text-amber-800 hover:bg-amber-200/70'
            }`}
            title="สลับโหมดตรวจสอบ Database"
          >
            <Bug size={10} />
            <span>{isDebugOpen ? 'DEBUG' : 'DEBUG'}</span>
          </button>
        </div>

        {/* Actions Right (Warm Amber Harmonized Palette) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* ปุ่มเปิด Dashboard / สรุป */}
          <button
            type="button"
            onClick={onOpenDashboard}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100/90 active:scale-95 text-amber-800 text-xs font-bold rounded-xl border border-amber-200/80 transition-all cursor-pointer shadow-2xs"
            title="ดู Dashboard สรุปภาพรวมและสถิติ"
          >
            <BarChart3 size={14} className="text-amber-700 shrink-0" />
            <span className="text-[11px] sm:text-xs">สรุป</span>
          </button>

          {/* ปุ่มเปิดประวัติ */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100/90 active:scale-95 text-amber-800 text-xs font-bold rounded-xl border border-amber-200/80 transition-all cursor-pointer shadow-2xs"
            title="ดูประวัติย้อนหลัง"
          >
            <History size={14} className="text-amber-700 shrink-0" />
            <span className="hidden sm:inline">ประวัติ</span>
          </button>
          
          {/* ปุ่มเพิ่มผู้ฝากขาย */}
          <button
            type="button"
            onClick={onOpenAddSeller}
            className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={14} className="shrink-0" />
            <span className="text-[11px] sm:text-xs whitespace-nowrap">เพิ่มผู้ฝาก</span>
          </button>
        </div>
      </div>
    </header>
  );
}
