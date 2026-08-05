import React from 'react';

export default function Header({ onOpenAddSeller, isDebugOpen, onToggleDebug, onOpenHistory }) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="max-w-md mx-auto flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">PX Daily Report</h1>
            <button
              onClick={onToggleDebug}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition-colors ${
                isDebugOpen ? 'bg-yellow-400 text-slate-900' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {isDebugOpen ? 'DEBUG ON' : 'DEBUG'}
            </button>
          </div>
          <p className="text-xs text-gray-500">ระบบบันทึกรายงานยอดฝากขายประจำวัน</p>
        </div>

        <div className="flex gap-1.5">
          {/* ปุ่มเปิดประวัติ */}
          <button
            onClick={onOpenHistory}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
            title="ดูประวัติย้อนหลัง"
          >
            📜
          </button>
          <button
            onClick={onOpenAddSeller}
            className="flex items-center gap-1 bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-colors"
          >
            + เพิ่มผู้ฝาก
          </button>
        </div>
      </div>
    </header>
  );
}
