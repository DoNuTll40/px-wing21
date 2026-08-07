import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Users, 
  ArrowLeft, 
  RefreshCw,
  Trophy,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Info
} from 'lucide-react';
import { getDashboardAnalytics } from '../services/dashboardService';
import { formatDateThai } from '../utils/formatDate';

export default function Dashboard({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [openSellers, setOpenSellers] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardAnalytics();
      setData(res);
      const now = new Date();
      setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSeller = (sellerId) => {
    setOpenSellers((prev) => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-gray-500">กำลังประมวลผลข้อมูล Dashboard Real-time...</p>
        </div>
      </div>
    );
  }

  const { summary, sellerStats, topProducts, weeklyTrend, todayDate } = data || {};
  const sellThroughRate = summary.totalSent > 0 
    ? Math.round((summary.totalSold / summary.totalSent) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
      {/* Top Bar Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-blue-600 bg-gray-100 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
          >
            <ArrowLeft size={16} />
            <span>กลับหน้าป้อนข้อมูล</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-mono">อัปเดต {lastUpdated} น.</span>
            <button
              onClick={loadData}
              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:rotate-180 transition-all"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Header Title */}
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <BarChart3 size={16} />
            <span>Real-time Executive Dashboard</span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">สรุปยอดขายประจำวัน</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Calendar size={13} />
            <span>{formatDateThai(todayDate, { full: true })}</span>
          </p>
        </div>

        {/* 4 Cards Summary KPIs */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-xs font-medium">ส่งรวมทั้งหมด</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Package size={16} />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900">{summary.totalSent.toLocaleString()}</div>
            <span className="text-[10px] text-gray-400">จาก {summary.totalProducts} รายการสินค้า</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-xs font-medium">ขายได้รวม</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShoppingBag size={16} />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-600">{summary.totalSold.toLocaleString()}</div>
            <span className="text-[10px] text-gray-400">ยอดคงเหลือ: {summary.totalRemain.toLocaleString()}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-xs font-medium">อัตราขายได้</span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-xl font-bold text-purple-600">{sellThroughRate}%</div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(sellThroughRate, 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-xs font-medium">ผู้ฝากลงรายการ</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Users size={16} />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {summary.activeSellers} <span className="text-xs font-normal text-gray-400">/ {summary.totalSellers} คน</span>
            </div>
            <span className="text-[10px] text-amber-600 font-medium">
              {summary.activeSellers === summary.totalSellers ? '✓ ครบทุกคนแล้ว' : `ขาดอีก ${summary.totalSellers - summary.activeSellers} คน`}
            </span>
          </div>
        </div>

        {/* Section: สรุปแยกตามผู้ฝากขาย + กดคลี่ดูรายชื่อสินค้าได้ */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <User size={16} className="text-blue-600" />
              <span>ประสิทธิภาพผู้ฝากขายวันนี้</span>
            </h3>
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Info size={11} /> แตะที่ชื่อเพื่อดูสินค้า
            </span>
          </div>

          <div className="space-y-2.5">
            {sellerStats.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-4">ยังไม่มีข้อมูลรายงานของวันนี้</p>
            ) : (
              sellerStats.map((s) => {
                const rate = s.total_sent > 0 ? Math.round((s.total_sold / s.total_sent) * 100) : 0;
                const isExpanded = !!openSellers[s.seller_id];

                return (
                  <div key={s.seller_id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
                    {/* Header แถบชื่อผู้ฝากขาย */}
                    <div
                      onClick={() => toggleSeller(s.seller_id)}
                      className="p-2.5 bg-white hover:bg-gray-50 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex justify-between items-center text-xs mb-1">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                          {isExpanded ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-gray-400" />}
                          <span>{s.seller_name}</span>
                          <span className="text-[10px] font-normal text-gray-400">({s.products.length} รายการ)</span>
                        </div>
                        <span className="font-mono text-gray-600">
                          <strong className="text-emerald-600">{s.total_sold}</strong> / {s.total_sent} ({rate}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${Math.min(rate, 100)}%` }}></div>
                      </div>
                    </div>

                    {/* รายละเอียดสินค้าด้านใน (แสดงเมื่อกดคลี่ออก) */}
                    {isExpanded && (
                      <div className="p-2.5 bg-gray-50 border-t border-gray-100 space-y-1.5 text-xs">
                        {s.products.length === 0 ? (
                          <p className="text-[11px] text-gray-400 text-center py-1">ไม่มีการลงรายการสินค้าในวันนี้</p>
                        ) : (
                          s.products.map((p) => (
                            <div key={p.product_id} className="flex justify-between items-center py-1 border-b border-gray-200/50 last:border-0">
                              <span className="font-medium text-gray-700">{p.product_name}</span>
                              <div className="flex gap-2 text-[11px] font-mono">
                                <span className="text-gray-500">ส่ง <strong className="text-gray-800">{p.sent}</strong></span>
                                <span className="text-emerald-600 font-bold">ขาย {p.sold}</span>
                                <span className="text-gray-400">เหลือ {p.remain} {p.unit}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section: 5 สินค้าขายดีที่สุด */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5 text-amber-600">
            <Trophy size={16} />
            <span className="text-gray-800">5 สินค้าขายดีวันนี้</span>
          </h3>

          <div className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-4">ยังไม่มีสินค้ายอดขายเกิดขึ้นในวันนี้</p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-bold ${
                      idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-gray-800">{p.product_name}</div>
                      <div className="text-[10px] text-gray-400">ฝากโดย: {p.seller_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600">ขาย {p.sold} {p.unit}</div>
                    <div className="text-[10px] text-gray-400">ส่ง {p.sent} | เหลือ {p.remain}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section: แนวโน้ม 7 วันล่าสุด */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <h3 className="font-bold text-gray-800 text-sm mb-3">📅 สรุปยอดขาย 7 วันย้อนหลัง</h3>
          <div className="space-y-2">
            {weeklyTrend.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-4">ไม่มีประวัติยอดขายในช่วง 7 วันที่ผ่านมา</p>
            ) : (
              weeklyTrend.map((t) => (
                <div key={t.date} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0 text-xs">
                  <span className="font-mono text-gray-600">{formatDateThai(t.date)}</span>
                  <div className="flex gap-3 font-mono">
                    <span className="text-gray-500">ส่ง {t.total_sent}</span>
                    <span className="font-bold text-emerald-600">ขาย {t.total_sold}</span>
                    <span className="text-gray-400">เหลือ {t.total_remain}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
