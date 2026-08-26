import { Store, Loader2 } from 'lucide-react';

export default function Loading({ message = 'กำลังโหลดข้อมูลรายงาน...' }) {
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center gap-4 select-none px-4">
      {/* Icon Wrapper */}
      <div className="relative flex items-center justify-center">
        {/* คลื่นแสงจังหวะนุ่มๆ */}
        <div className="absolute w-18 h-18 rounded-4xl bg-amber-400/20 animate-ping opacity-75 z-0"></div>
        <div className="absolute w-20 h-20 rounded-4xl bg-amber-400/10 animate-pulse z-0"></div>

        {/* กล่องไอคอนร้านค้า */}
        <div className="relative w-14 h-14 rounded-3xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 z-10">
          <Store size={26} className="stroke-[2.25]" />
        </div>
      </div>

      {/* ป้ายข้อความสถานะ พร้อม Spinner วงล้อหมุนจริง */}
      <div className="flex items-center gap-2 text-xs font-bold text-amber-950 bg-white/90 backdrop-blur-xs border border-amber-200/90 px-3.5 py-1.5 rounded-2xl shadow-2xs z-10 mt-1">
        <Loader2 size={14} className="animate-spin text-amber-500 stroke-[2.5]" />
        <span>{message}</span>
      </div>
    </div>
  );
}