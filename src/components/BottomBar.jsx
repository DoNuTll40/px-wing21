import { Save, Copy, Check, Loader2 } from 'lucide-react';

export default function BottomBar({ onSave, onGenerate, isSaved, isCopied, isSubmitting }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-0 sm:px-4 md:bottom-4 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-white border-t sm:border border-amber-200/80 sm:rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-amber-900/5 flex gap-2.5">
          
          {/* 1. ปุ่มบันทึกข้อมูล */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer border shadow-2xs ${
              isSaved
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-amber-100/80 hover:bg-amber-200/90 active:bg-amber-300 text-amber-900 border-amber-300/90'
            }`}
            title="บันทึกข้อมูลลงฐานข้อมูล (Ctrl+S บน PC)"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin text-amber-800" />
            ) : isSaved ? (
              <>
                <Check size={16} className="text-white" />
                <span>บันทึกแล้ว!</span>
              </>
            ) : (
              <>
                <Save size={16} className="text-amber-800" />
                <span>บันทึกข้อมูล</span>
                <span className="text-[10px] opacity-60 font-mono hidden sm:inline">(Ctrl+S)</span>
              </>
            )}
          </button>

          {/* 2. ปุ่มคัดลอกรายงาน */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={isSubmitting}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/25 ${
              isCopied
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-white'
            }`}
            title="บันทึกข้อมูลลงฐานข้อมูล พร้อมคัดลอกข้อความสรุป"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : isCopied ? (
              <>
                <Check size={16} className="text-white" />
                <span>คัดลอกแล้ว!</span>
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
