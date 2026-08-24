import React, { useState, useEffect } from 'react';
import { History, Copy, Check, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { getReportHistoryGrouped } from '../../services/historyService';
import { formatDateThai } from '../../utils/formatDate';
import { generateReportText } from '../../utils/generateReport';
import { copyToClipboard } from '../../utils/clipboard';

export default function BentoHistoryPeek({ onOpenFullHistory }) {
  const [recentDates, setRecentDates] = useState([]);
  const [historyMap, setHistoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [copiedDate, setCopiedDate] = useState(null);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const { historyMap: data } = await getReportHistoryGrouped(3, 0);
        setHistoryMap(data || {});
        setRecentDates(Object.keys(data || {}).slice(0, 3));
      } catch (err) {
        console.error('Failed to load recent history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const handleCopyDateReport = async (date, sellersGroup) => {
    const sellersList = [];
    const productsList = [];

    Object.entries(sellersGroup).forEach(([sellerName, products], index) => {
      const sellerId = index + 1;
      sellersList.push({ id: sellerId, name: sellerName });

      products.forEach((prod) => {
        productsList.push({
          seller_id: sellerId,
          product_id: prod.product_id || prod.id,
          name: prod.product_name,
          unit: prod.unit,
          sent: prod.sent,
          sold: prod.sold,
          remain: prod.remain
        });
      });
    });

    const reportText = generateReportText(sellersList, productsList);
    const success = await copyToClipboard(reportText);

    if (success) {
      setCopiedDate(date);
      setTimeout(() => setCopiedDate(null), 2500);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <History size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">ประวัติรายงานย้อนหลัง</h3>
            <p className="text-[10px] text-slate-400">3 วันล่าสุด (กดคัดลอกได้ทันที)</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenFullHistory}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-2 flex-1">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400">
            <Loader2 size={18} className="animate-spin text-blue-600" />
            <span>กำลังดึงข้อมูลย้อนหลัง...</span>
          </div>
        ) : recentDates.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            ยังไม่มีประวัติรายงานย้อนหลัง
          </div>
        ) : (
          recentDates.map((date) => {
            const sellersGroup = historyMap[date] || {};
            const sellersCount = Object.keys(sellersGroup).length;
            const isCopied = copiedDate === date;

            return (
              <div 
                key={date}
                className="p-2.5 bg-slate-50/80 hover:bg-slate-100/60 border border-slate-100 rounded-2xl flex items-center justify-between gap-2 transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-800 truncate block">
                      {formatDateThai(date, { full: false })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {sellersCount} ผู้ฝากขาย
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyDateReport(date, sellersGroup)}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer shrink-0 ${
                    isCopied
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                  }`}
                  title="คัดลอกข้อความรายงานวันนี้"
                >
                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
