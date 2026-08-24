import React, { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, CheckCircle2, XCircle, Loader2, Server, Store, Package, FileSpreadsheet } from 'lucide-react';
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
      message: 'กำลังทดสอบการเชื่อมต่อ...'
    }));

    const envUrl = import.meta.env.VITE_NEON_DATABASE_URL;

    if (!envUrl) {
      setStatus({
        loading: false,
        ok: false,
        message: 'ไม่พบตัวแปร VITE_NEON_DATABASE_URL ในไฟล์ .env',
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

      // 3. ดึงจำนวนแถวทั้งหมดใน reports และนับจำนวนวันที่มีการบันทึกรายงาน
      const reports = await sql`SELECT COUNT(*) FROM reports`;
      const reportDays = await sql`
        SELECT COUNT(DISTINCT DATE(report_date)) FROM reports
      `;

      setStatus({
        loading: false,
        ok: true,
        message: 'เชื่อมต่อ Neon PostgreSQL สำเร็จ ปกติ 100%',
        sellersCount: Number(sellers[0]?.count || 0),
        productsCount: Number(products[0]?.count || 0),
        reportsCount: Number(reports[0]?.count || 0),
        reportDaysCount: Number(reportDays[0]?.count || 0),
        envVal: envUrl.includes('@') ? envUrl.split('@')[1].split('/')[0] : 'Connected'
      });
    } catch (err) {
      console.error('DB Check Failed:', err);
      setStatus({
        loading: false,
        ok: false,
        message: `เชื่อมต่อล้มเหลว: ${err.message || 'Unknown Error'}`,
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
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-amber-200/90 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center pb-2.5 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70">
            <Database size={15} />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">
              สถานะฐานข้อมูล (Neon Diagnostics)
            </h4>
            <p className="text-[10px] text-gray-400 font-mono">Neon Serverless PostgreSQL</p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            runCheck();
          }}
          disabled={status.loading}
          className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-200/80 font-bold px-2.5 py-1 rounded-xl text-xs shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={status.loading ? 'animate-spin text-amber-700' : 'text-amber-700'} />
          <span>{status.loading ? 'กำลังตรวจ...' : 'ตรวจใหม่'}</span>
        </button>
      </div>

      {/* Connection State Badge */}
      {status.loading ? (
        <div className="py-3 px-3.5 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center gap-2 text-xs text-amber-800 font-medium">
          <Loader2 size={15} className="animate-spin text-amber-600" />
          <span>กำลังทดสอบความพร้อมของฐานข้อมูล Neon PostgreSQL...</span>
        </div>
      ) : (
        <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
          status.ok 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' 
            : 'bg-red-50 text-red-800 border-red-200/80'
        }`}>
          {status.ok ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <XCircle size={16} className="text-red-600 shrink-0" />}
          <span className="truncate">{status.message}</span>
        </div>
      )}

      {/* Bento Mini Metric Grid */}
      {!status.loading && status.ok && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-xs">
          {/* 1. Sellers */}
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-2.5 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-800">
              <Store size={14} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-medium leading-none mb-1">ผู้ฝากขาย</p>
              <p className="text-xs font-black text-gray-900 font-mono">{status.sellersCount} <span className="text-[10px] font-sans font-normal text-gray-500">ราย</span></p>
            </div>
          </div>

          {/* 2. Products */}
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-2.5 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-800">
              <Package size={14} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-medium leading-none mb-1">สินค้าทั้งหมด</p>
              <p className="text-xs font-black text-gray-900 font-mono">{status.productsCount} <span className="text-[10px] font-sans font-normal text-gray-500">รายการ</span></p>
            </div>
          </div>

          {/* 3. Report Days */}
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-2.5 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-800">
              <FileSpreadsheet size={14} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-medium leading-none mb-1">ประวัติบันทึก</p>
              <p className="text-xs font-black text-gray-900 font-mono">{status.reportDaysCount} <span className="text-[10px] font-sans font-normal text-gray-500">วัน ({status.reportsCount} แถว)</span></p>
            </div>
          </div>

          {/* 4. Host Info */}
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-2.5 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-800">
              <Server size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-medium leading-none mb-1">Database Host</p>
              <p className="text-[11px] font-bold text-gray-800 font-mono truncate" title={status.envVal}>
                {status.envVal}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
