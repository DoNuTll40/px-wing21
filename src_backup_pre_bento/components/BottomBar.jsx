import React from 'react';
import { Save, Copy, Check, Loader2, Command } from 'lucide-react';

export default function BottomBar({ 
  onSave, 
  onGenerate, 
  isSaved, 
  isCopied, 
  isSubmitting 
}) {
  return (
    <div className="fixed bottom-0 md:bottom-5 inset-x-0 z-40 px-3 md:px-0 pointer-events-none">
      <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto bg-white/95 md:bg-white/90 backdrop-blur-lg border-t md:border border-gray-200/90 md:rounded-2xl p-2.5 md:p-3 shadow-xl md:shadow-2xl pointer-events-auto transition-all">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. ปุ่มบันทึกข้อมูลอย่างเดียว */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className={`flex-1 py-3 px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
                : 'bg-gray-800 hover:bg-gray-900 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isSaved ? (
              <>
                <Check size={16} />
                <span>บันทึกแล้ว</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>บันทึกข้อมูล</span>
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white/90 ml-1">
                  Ctrl+S
                </span>
              </>
            )}
          </button>

          {/* 2. ปุ่มบันทึก + คัดลอกข้อความรายงาน */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={isSubmitting}
            className={`flex-1 py-3 px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
              isCopied
                ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-md hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isCopied ? (
              <>
                <Check size={16} />
                <span>คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>คัดลอกรายงาน</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

