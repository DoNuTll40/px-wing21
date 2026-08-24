import React, { useState, useEffect, useCallback } from 'react';
import sql from '../lib/neon';

export default function DbHealthCheck() {
  const [status, setStatus] = useState({
    loading: true,
    ok: false,
    message: 'กำลังเริ่มต้นตรวจสอบ...',
    sellersCount: 0,
    productsCount: 0,
    reportsCount: 0,
    reportDaysCount: 0,
    envVal: ''
  });

  const runCheck = useCallback(async () => {
    setStatus((prev) => ({
      ...prev,
      loading: true,
      message: '⏳ กำลังทดสอบการเชื่อมต่อ...'
    }));

    const envUrl = import.meta.env.VITE_NEON_DATABASE_URL;

    if (!envUrl) {
      setStatus({
        loading: false,
        ok: false,
        message: '❌ ไม่พบตัวแปร VITE_NEON_DATABASE_URL ใน .env',
        sellersCount: 0,
        productsCount: 0,
        reportsCount: 0,
        reportDaysCount: 0,
        envVal: 'UNDEFINED'
      });
      return;
    }

    try {
      // 1. ทดสอบการรัน Query สั้น ๆ
      await sql`SELECT 1`;

      // 2. ดึงจำนวน Sellers และ Products
      const sellers = await sql`SELECT COUNT(*) FROM sellers`;
      const products = await sql`SELECT COUNT(*) FROM products`;

      // 3. ดึงจำนวนแถวทั้งหมดใน reports และนับจำนวนวันที่มีการบันทึกรายงาน (Group By Date)
      const reports = await sql`SELECT COUNT(*) FROM reports`;
      const reportDays = await sql`
        SELECT COUNT(DISTINCT DATE(created_at)) FROM reports
      `;

      setStatus({
        loading: false,
        ok: true,
        message: '✅ เชื่อมต่อ Neon Database สำเร็จ!',
        sellersCount: Number(sellers[0]?.count || 0),
        productsCount: Number(products[0]?.count || 0),
        reportsCount: Number(reports[0]?.count || 0),
        reportDaysCount: Number(reportDays[0]?.count || 0),
        envVal: envUrl.substring(0, 20) + '...'
      });
    } catch (err) {
      console.error('DB Check Failed:', err);
      setStatus({
        loading: false,
        ok: false,
        message: `❌ เชื่อมต่อล้มเหลว: ${err.message || 'Unknown Error'}`,
        sellersCount: 0,
        productsCount: 0,
        reportsCount: 0,
        reportDaysCount: 0,
        envVal: envUrl ? 'Found' : 'Not Found'
      });
    }
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return (
    <div className="relative z-20 bg-slate-900 text-white p-4 rounded-xl my-4 text-xs font-mono shadow-md border border-slate-700">
      <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
        <span className="font-bold text-yellow-400 flex items-center gap-1">
          🔍 Database Diagnostics
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            runCheck();
          }}
          disabled={status.loading}
          className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 text-white font-sans px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer touch-manipulation"
        >
          {status.loading ? 'Checking...' : '🔄 Re-test'}
        </button>
      </div>

      {status.loading ? (
        <div className="py-2 text-slate-400 animate-pulse">⏳ กำลังทดสอบการเชื่อมต่อ Neon PostgreSQL...</div>
      ) : (
        <div className="space-y-1.5 leading-relaxed">
          <p className={status.ok ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {status.message}
          </p>
          <div className="text-slate-300 pt-1">
            <p><span className="text-slate-500">ENV:</span> {status.envVal}</p>
            <p><span className="text-slate-500">Sellers:</span> <strong className="text-white">{status.sellersCount}</strong> รายการ</p>
            <p><span className="text-slate-500">Products:</span> <strong className="text-white">{status.productsCount}</strong> รายการ</p>
            <p><span className="text-slate-500">Reports (วัน):</span> <strong className="text-white">{status.reportDaysCount}</strong> วัน ({status.reportsCount} แถว)</p>
          </div>
        </div>
      )}
    </div>
  );
}
