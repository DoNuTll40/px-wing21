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
      setLastUpdated(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
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

  const summary = data?.summary || {
    totalSent: 0,
    totalSold: 0,
    totalRemain: 0,
    activeSellers: 0,
    totalSellers: 0,
    totalProducts: 0
  };
  const sellerStats = Array.isArray(data?.sellerStats) ? data.sellerStats : [];
  const topProducts = Array.isArray(data?.topProducts) ? data.topProducts : [];
  const weeklyTrend = Array.isArray(data?.weeklyTrend) ? data.weeklyTrend : [];
  const todayDate = data?.todayDate || '';

  const sellThroughRate = summary.totalSent > 0 
    ? Math.round((summary.totalSold / summary.totalSent) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
      {/* Top Bar Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>กลับหน้าป้อนข้อมูล</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono">อัปเดตล่าสุด {lastUpdated} น.</span>
            <button
              onClick={loadData}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:rotate-180 transition-all cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200/60 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
              <BarChart3 size={16} />
              <span>Real-time Executive Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">สรุปยอดขายประจำวัน</h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs self-start md:self-auto">
            <Calendar size={14} className="text-blue-600" />
            <span>{formatDateThai(todayDate, { full: true })}</span>
          </p>
        </div>

        {/* 4 Cards Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-xs md:text-sm font-medium">ส่งรวมทั้งหมด</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Package size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-gray-900">{summary.totalSent.toLocaleString()}</div>
              <span className="text-xs text-gray-400 mt-0.5 block">จาก {summary.totalProducts} รายการสินค้า</span>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-xs md:text-sm font-medium">ขายได้รวม</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-600">{summary.totalSold.toLocaleString()}</div>
              <span className="text-xs text-gray-400 mt-0.5 block">ยอดคงเหลือ: {summary.totalRemain.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-xs md:text-sm font-medium">อัตราขายได้</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <TrendingUp size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-purple-600">{sellThroughRate}%</div>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(sellThroughRate, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-xs md:text-sm font-medium">ผู้ฝากลงรายการ</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Users size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {summary.activeSellers} <span className="text-xs md:text-sm font-normal text-gray-400">/ {summary.totalSellers} คน</span>
              </div>
              <span className="text-xs text-amber-600 font-medium mt-0.5 block">
                {summary.activeSellers === summary.totalSellers ? '✓ ครบทุกคนแล้ว' : `ขาดอีก ${summary.totalSellers - summary.activeSellers} คน`}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: รายงานผู้ฝากขายประจำวัน */}
          <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                <span>ประสิทธิภาพผู้ฝากขายวันนี้</span>
              </h3>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Info size={13} /> แตะที่แถบเพื่อดูเจาะลึกสินค้า
              </span>
            </div>

            <div className="space-y-3">
              {sellerStats.length === 0 ? (
                <p className="text-sm text-center text-gray-400 py-8">ยังไม่มีข้อมูลรายงานของวันนี้</p>
              ) : (
                sellerStats.map((s) => {
                  const rate = s.total_sent > 0 ? Math.round((s.total_sold / s.total_sent) * 100) : 0;
                  const isExpanded = !!openSellers[s.seller_id];
                  const products = Array.isArray(s.products) ? s.products : [];

                  return (
                    <div key={s.seller_id} className="border border-gray-200/80 rounded-xl overflow-hidden bg-gray-50/50">
                      <div
                        onClick={() => toggleSeller(s.seller_id)}
                        className="p-3 bg-white hover:bg-gray-50 cursor-pointer select-none transition-colors"
                      >
                        <div className="flex justify-between items-center text-xs md:text-sm mb-1.5">
                          <div className="flex items-center gap-2 font-semibold text-gray-800">
                            {isExpanded ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-gray-400" />}
                            <span>{s.seller_name}</span>
                            <span className="text-xs font-normal text-gray-400">({products.length} รายการ)</span>
                          </div>
                          <span className="font-mono text-gray-600">
                            <strong className="text-emerald-600">{s.total_sold}</strong> / {s.total_sent} ({rate}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.min(rate, 100)}%` }}></div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-3 bg-gray-50 border-t border-gray-200/60 space-y-2 text-xs md:text-sm">
                          {products.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-2">ไม่มีการลงรายการสินค้าในวันนี้</p>
                          ) : (
                            products.map((p) => (
                              <div key={p.product_id} className="flex justify-between items-center py-1.5 border-b border-gray-200/60 last:border-0">
                                <span className="font-medium text-gray-700">{p.product_name}</span>
                                <div className="flex gap-3 text-xs md:text-sm font-mono">
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

          {/* Column 3: สินค้าขายดี (Weighted Ranking) + สรุป 7 วัน */}
          <div className="space-y-6">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 text-amber-600">
                  <Trophy size={18} />
                  <span className="text-gray-800">5 สินค้าขายดีวันนี้</span>
                </h3>
                <span className="text-[10px] text-gray-400 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  ยอดขาย × %ขายได้
                </span>
              </div>

              <div className="space-y-2.5">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6">ยังไม่มีสินค้ายอดขายเกิดขึ้นในวันนี้</p>
                ) : (
                  topProducts.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs md:text-sm font-bold text-gray-800">{p.product_name}</div>
                          <div className="text-[11px] text-gray-400">ฝากโดย: {p.seller_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs md:text-sm font-bold text-emerald-600">
                            ขาย {p.sold} {p.unit}
                          </span>
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.2 rounded-md">
                            {p.sell_rate}%
                          </span>
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                          ส่ง {p.sent} | เหลือ {p.remain}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-2xs">
              <h3 className="font-bold text-gray-800 text-base mb-4 pb-2 border-b border-gray-100">📅 ยอดขาย 7 วันย้อนหลัง</h3>
              <div className="space-y-2.5">
                {weeklyTrend.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6">ไม่มีประวัติยอดขายในช่วง 7 วันที่ผ่านมา</p>
                ) : (
                  weeklyTrend.map((t) => (
                    <div key={t.date} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0 text-xs md:text-sm">
                      <span className="font-mono text-gray-600">{formatDateThai(t.date)}</span>
                      <div className="flex gap-2 md:gap-3 font-mono text-xs">
                        <span className="text-gray-500">ส่ง {t.total_sent}</span>
                        <span className="font-bold text-emerald-600">ขาย {t.total_sold}</span>
                        <span className="text-gray-400">เหลือ {t.total_remain}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
