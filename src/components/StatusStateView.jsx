import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Terminal, ShieldAlert, Copy, Check, Link2, Info, ClockAlert, SearchX, FileQuestion } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { vibrateSuccess } from '../utils/haptics';
import Footer from './Footer';

/**
 * 🌟 Component กลางสำหรับหน้าแจ้งสถานะต่างๆ (404, Expired, Invalid Token, Error)
 * สไตล์ Bento Warm Amber
 */
export default function StatusStateView({
  type = '404', // '404' | 'expired' | 'invalid' | 'custom'
  badgeText,
  codeText,
  title,
  description,
  customUrl,
  inspectorTitle = 'URL & ROUTE INSPECTOR',
  routeLabel,
  statusTagText,
  auditTitle = 'ข้อแนะนำ & สาเหตุ',
  auditItems = [],
  auditIcon: AuditIcon,
  footerHintText = 'กรุณาติดต่อผู้ดูแลร้านเพื่อขอรับลิงก์ใหม่',
  systemSubTitle = 'ระบบรายงานยอดขายส่วนบุคคล'
}) {
  const [copied, setCopied] = useState(false);

  // ค่า Default ตาม Type
  const isExpired = type === 'expired';
  const isInvalid = type === 'invalid';
  const is404 = type === '404';

  const defaultBadgeText = badgeText || (isExpired ? 'LINK EXPIRED' : isInvalid ? 'TOKEN INVALID' : 'STATUS 404');
  const defaultCodeText = codeText || (isExpired ? 'EXP' : '404');
  const defaultTitle = title || (isExpired ? 'ลิงก์รายงานนี้หมดอายุการใช้งานแล้ว' : isInvalid ? 'ไม่พบข้อมูลผู้ฝากขาย' : 'ไม่พบหน้าที่คุณต้องการเข้าถึง');
  const defaultDesc = description || (isExpired ? 'ลิงก์นี้หมดอายุตามเวลาที่กำหนดไว้ กรุณาติดต่อขอรับลิงก์ใหม่' : 'เส้นทางหรือโทเค็นรายงานนี้อาจไม่ถูกต้อง หรือถูกปิดการเข้าถึงจากระบบแล้ว');

  const defaultStatusTag = statusTagText || (isExpired ? 'Expired Token' : isInvalid ? 'Validation Failed' : 'Unresolved Path');

  const defaultAuditItems = auditItems.length > 0 ? auditItems : (
    isExpired ? [
      'ลิงก์นี้หมดอายุตามเวลาที่ร้านกำหนด',
      'สิทธิ์การดูข้อมูลถูกตัดการเชื่อมต่อ',
      'ติดต่อร้านค้าเพื่อรับลิงก์ใหม่'
    ] : isInvalid ? [
      'คัดลอกลิงก์มาไม่ครบตัวอักษร',
      'รหัสผู้ฝากขายไม่มีอยู่ในระบบ',
      'ตรวจสอบลิงก์จาก LINE อีกครั้ง'
    ] : [
      'พิมพ์ที่อยู่ URL ไม่ครบถ้วน',
      'ลิงก์แชร์หมดอายุการใช้งาน',
      'ไม่มีสิทธิ์เข้าถึงหน้านี้โดยตรง'
    ]
  );

  const fullUrl = customUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(fullUrl);
    if (success) {
      vibrateSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const IconHeader = AuditIcon || (isExpired ? ClockAlert : isInvalid ? SearchX : is404 ? FileQuestion : ShieldAlert);

  return (
    <div className="min-h-screen bg-[#fffdf7] flex flex-col justify-between p-4 sm:p-6 font-sans select-none relative overflow-hidden">
      {/* Background Decor Orbs */}
      <div className="absolute top-1/4 -left-24 w-80 h-80 bg-amber-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-24 w-80 h-80 bg-amber-300/25 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Store size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-900 leading-tight">PX Daily Report</h1>
            <span className="text-[10px] text-amber-800 font-medium block leading-none">
              {systemSubTitle}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black shadow-2xs border ${
            isExpired
              ? 'bg-rose-50 border-rose-200/80 text-rose-700'
              : 'bg-amber-50 border-amber-200/80 text-amber-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              isExpired ? 'bg-rose-500' : 'bg-amber-500'
            }`}
          />
          <span>{defaultBadgeText}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto my-auto py-6 z-10">
        {/* Section 1: Hero Graphic & Big Typography */}
        <div className="text-center space-y-2 mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="inline-flex items-center justify-center relative"
          >
            <span className="text-8xl sm:text-[11rem] font-black tracking-tighter text-amber-950/15 select-none leading-none">
              {defaultCodeText}
            </span>

            <motion.img
              animate={{ y: [-4, 6, -4], rotate: [-1, 2, -1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              src="/page-not-found.webp"
              className="w-24 h-24 sm:w-36 sm:h-36 inline-block pointer-events-none relative right-4 sm:right-7 drop-shadow-xl"
              alt={defaultCodeText}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-1"
          >
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {defaultTitle}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto text-balance leading-relaxed">
              {defaultDesc}
            </p>
          </motion.div>
        </div>

        {/* Section 2: Bento Grid 2 Columns */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-3.5"
        >
          {/* Card 1: URL & Link Inspector (2 Col) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <div className="flex items-center gap-1.5 text-amber-900">
                <Terminal size={14} className="text-amber-600" />
                <span>{inspectorTitle}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="คัดลอกลิงก์นี้"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-amber-700" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</span>
              </button>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/70 font-mono text-xs text-amber-950 flex items-start sm:items-center gap-2 select-all overflow-x-auto">
              <Link2 size={14} className="text-amber-500 shrink-0" />
              <span className="break-all leading-relaxed font-semibold">{fullUrl}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
              <span className="truncate max-w-[200px] sm:max-w-xs">
                {routeLabel || `Route: ${pathname}`}
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md border text-[10px] shrink-0 ${
                  isExpired
                    ? 'text-rose-600 bg-rose-50 border-rose-200'
                    : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}
              >
                {defaultStatusTag}
              </span>
            </div>
          </div>

          {/* Card 2: Security & Guidance Audit (1 Col) */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40 rounded-3xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold ${
                  isExpired
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-amber-100 border-amber-200 text-amber-800'
                }`}
              >
                <IconHeader size={16} />
              </div>
              <span className="text-[10px] font-black text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200/80">
                Access Audit
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-gray-900 block">{auditTitle}</span>
              <ul className="text-[11px] text-gray-600 space-y-1 list-disc list-inside leading-relaxed font-medium">
                {defaultAuditItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900/80 bg-white/80 border border-amber-200/60 p-2 rounded-xl">
              <Info size={13} className="text-amber-600 shrink-0" />
              <span>{footerHintText}</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pb-2 px-2 z-10">
        <Footer title="PX Daily Report System • ระบบรายงานยอดขายประจำวัน " />
      </footer>
    </div>
  );
}