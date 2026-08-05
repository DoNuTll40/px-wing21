import React from 'react';

export default function EmptyState({ onAddSeller }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1">ยังไม่มีผู้ฝากขาย</h3>
      <p className="text-xs text-gray-500 max-w-xs mb-5">
        เริ่มสร้างโครงสร้างรายชื่อผู้ฝากขายและรายการสินค้าเพื่อเริ่มใช้งาน
      </p>
      <button
        onClick={onAddSeller}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
      >
        + เพิ่มผู้ฝากขายคนแรก
      </button>
    </div>
  );
}
