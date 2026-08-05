import React from 'react';

export default function BottomBar({ onGenerate, isCopied, isSubmitting }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 shadow-lg z-10">
      <div className="max-w-md mx-auto">
        <button
          onClick={onGenerate}
          disabled={isSubmitting}
          className={`w-full h-12 flex items-center justify-center gap-2 font-bold text-base rounded-xl shadow-md transition-all active:scale-[0.98] ${
            isCopied
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
          }`}
        >
          {isSubmitting ? (
            <span>กำลังบันทึกและสร้างรายงาน...</span>
          ) : isCopied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              คัดลอกรายงานเรียบร้อย! (พร้อมวางใน Line)
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}
