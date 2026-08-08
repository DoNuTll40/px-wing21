import React from 'react';
import { Save, Copy, Check, Loader2 } from 'lucide-react';

export default function BottomBar({ 
  onSave, 
  onGenerate, 
  isSaved, 
  isCopied, 
  isSubmitting 
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-3 z-40 shadow-lg">
      <div className="max-w-md mx-auto flex items-center gap-2">
        {/* 1. ปุ่มบันทึกข้อมูลอย่างเดียว */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${
            isSaved
              ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
              : 'bg-gray-800 hover:bg-gray-900 text-white shadow-md'
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
            </>
          )}
        </button>

        {/* 2. ปุ่มบันทึก + คัดลอกข้อความรายงาน */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isSubmitting}
          className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${
            isCopied
              ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-md'
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
  );
}
