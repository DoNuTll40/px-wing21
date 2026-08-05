import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <span className="text-xs text-gray-400 font-medium">กำลังโหลดข้อมูล...</span>
    </div>
  );
}
