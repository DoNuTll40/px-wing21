import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Lightbulb } from 'lucide-react';
import { analyzeDashboardWithAI } from '../services/aiService';

export default function AIInsightCard({ dashboardData }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🟢 ดึงชื่อ Model จาก VITE_GEMINI_URL ใน .env อัตโนมัติ
  const getModelDisplayName = () => {
    const url = import.meta.env.VITE_GEMINI_URL || '';
    const match = url.match(/models\/([^:]+)/);
    if (match && match[1]) {
      // แปลงเช่น gemini-3.6-flash -> Gemini 3.6 Flash
      return match[1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return 'Gemini AI';
  };

  const modelName = getModelDisplayName();

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await analyzeDashboardWithAI(dashboardData);
      setAnalysis(result);
    } catch (err) {
      setError(`วิเคราะห์ข้อมูลไม่สำเร็จ: ${err.message || 'โปรดตรวจสอบการเชื่อมต่อ'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-blue-800/40 relative overflow-hidden my-1">
      {/* Glow Effect Background */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-400/10 rounded-lg border border-amber-400/20">
            <Sparkles size={16} className="text-amber-400 animate-pulse" />
          </div>
          <span className="text-xs sm:text-sm font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200">
            AI Executive Insights
          </span>
        </div>

        {/* Glassmorphism Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 text-blue-100 border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 backdrop-blur-md font-medium"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-amber-300' : 'text-blue-200'} />
          <span>{analysis ? 'วิเคราะห์ใหม่' : 'ให้ AI วิเคราะห์'}</span>
        </button>
      </div>

      {/* Body Content */}
      {loading ? (
        /* Pulse Skeleton State */
        <div className="py-3 space-y-3 animate-pulse">
          <div className="h-12 bg-white/10 rounded-xl w-full"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="h-20 bg-white/5 rounded-xl border border-white/5"></div>
            <div className="h-20 bg-white/5 rounded-xl border border-white/5"></div>
          </div>
        </div>
      ) : error ? (
        <p className="text-xs text-rose-300 bg-rose-950/50 p-3 rounded-xl border border-rose-800/40 font-medium leading-relaxed">
          {error}
        </p>
      ) : analysis ? (
        <div className="space-y-3">
          {/* Executive Summary */}
          <div className="p-3 bg-blue-900/40 rounded-xl border border-blue-500/25 text-slate-100 text-xs sm:text-sm font-medium leading-relaxed shadow-inner">
            {analysis.executiveSummary}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Dead Stock Alert */}
            {analysis.deadStockAlerts?.length > 0 && (
              <div className="p-3 bg-amber-950/35 rounded-xl border border-amber-500/25 space-y-1.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                  <AlertTriangle size={14} />
                  <span>สินค้าเสี่ยงค้าง/จมทุน</span>
                </div>
                <ul className="list-disc list-inside text-amber-100/90 space-y-1 leading-relaxed text-[11px] sm:text-xs">
                  {analysis.deadStockAlerts.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actionable Suggestions */}
            {analysis.actionableSuggestions?.length > 0 && (
              <div className="p-3 bg-emerald-950/35 rounded-xl border border-emerald-500/25 space-y-1.5">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                  <Lightbulb size={14} />
                  <span>คำแนะนำปรับยอดพรุ่งนี้</span>
                </div>
                <ul className="list-disc list-inside text-emerald-100/90 space-y-1 leading-relaxed text-[11px] sm:text-xs">
                  {analysis.actionableSuggestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-1 font-normal leading-relaxed">
          แตะปุ่ม <strong className="text-blue-300 font-semibold">"ให้ AI วิเคราะห์"</strong> เพื่อให้ระบบสกัดข้อมูลเชิงบริหาร วิเคราะห์สินค้าเสี่ยงจมทุน และสรุปคำแนะนำการปรับยอดสั่งสินค้าประจำวัน
        </p>
      )}

      {/* 🟢 Footer Model Badge */}
      <div className="mt-3 pt-2 border-t border-white/5 flex justify-end items-center">
        <span className="text-[10px] font-mono text-slate-400/80 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
          Powered by Google {modelName}
        </span>
      </div>
    </div>
  );
}
