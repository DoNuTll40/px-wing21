import React from 'react';
import { History, Plus, Bug } from 'lucide-react';

export default function Header({ onOpenAddSeller, isDebugOpen, onToggleDebug, onOpenHistory }) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 shadow-xs">
      <div className="max-w-md md:max-w-5xl lg:max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">PX Daily Report</h1>
            <button
              onClick={onToggleDebug}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition-all flex items-center gap-1 ${
                isDebugOpen ? 'bg-amber-400 text-slate-900 shadow-xs' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <Bug size={11} />
              <span>{isDebugOpen ? 'DEBUG ON' : 'DEBUG'}</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">ระบบบันทึกรายงานยอดฝากขายประจำวัน</p>
        </div>

        <div className="flex items-center gap-2">
          {/* ปุ่มเปิดประวัติ */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            title="ดูประวัติย้อนหลัง"
          >
            <History size={15} className="text-gray-600" />
            <span className="hidden sm:inline">ประวัติย้อนหลัง</span>
          </button>
          
          {/* ปุ่มเพิ่มผู้ฝากขาย */}
          <button
            onClick={onOpenAddSeller}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>เพิ่มผู้ฝาก</span>
          </button>
        </div>
      </div>
    </header>
  );
}

