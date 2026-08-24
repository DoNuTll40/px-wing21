import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Lightbulb, Calendar, Send, MessageSquare, Bot, X, Maximize2, BarChart3, Download, Copy, Check, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { toPng } from 'html-to-image';
import { analyzeDashboardWithAI, sendChatFollowUp } from '../services/aiService';
import { copyToClipboard } from '../utils/clipboard';

// 🟢 1. ช่องพิมพ์ข้อความอิสระ (ธีม Warm Amber)
const ChatInputForm = memo(({ onSend, chatLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleTextareaChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || chatLoading) return;
    onSend(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    const isMobileDevice = typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);

    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      if (!isMobileDevice) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-end bg-amber-50/30 border border-amber-200/90 rounded-2xl p-1.5 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-200/60 transition-all">
      <textarea
        rows={2}
        value={inputValue}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        placeholder="พิมพ์ข้อความสอบถาม AI... (คอมฯ กด Enter เพื่อส่ง)"
        disabled={chatLoading}
        className="flex-1 bg-transparent px-3.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none resize-none min-h-[54px] max-h-[120px] leading-relaxed overflow-y-auto"
      />
      <button
        type="submit"
        disabled={!inputValue.trim() || chatLoading}
        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-white p-2.5 rounded-xl disabled:opacity-30 transition-all cursor-pointer shrink-0 shadow-xs shadow-amber-500/20 mb-0.5 mr-0.5 flex items-center justify-center"
      >
        <Send size={15} />
      </button>
    </form>
  );
});

// 🟢 2. คอมโพเนนต์กราฟแบบ Scroll X (ธีม Warm Amber)
const ChartCardComponent = memo(({ chartObj, uniqueId, onMaximize, onDownload }) => {
  const { chartType, title, data } = chartObj || {};
  if (!Array.isArray(data) || data.length === 0) return null;

  const chartElemId = `chart-card-${uniqueId}`;
  const dynamicMinWidth = Math.max((data?.length || 0) * 55, 320);

  return (
    <div className="my-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-amber-200/80 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between pb-1.5 border-b border-amber-100 gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 min-w-0">
          <BarChart3 size={15} className="text-amber-600 shrink-0" />
          <span className="truncate">{title || 'กราฟสรุปสถิติ'}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onMaximize({ ...chartObj, id: chartElemId })}
            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 rounded-xl transition-all cursor-pointer"
            title="ดูขยายเต็มจอ"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={() => onDownload(chartElemId, title, dynamicMinWidth)}
            className="p-1.5 bg-amber-50 hover:bg-emerald-50 hover:text-emerald-700 text-amber-800 border border-amber-200/70 rounded-xl transition-all cursor-pointer"
            title="บันทึกกราฟเป็นไฟล์ PNG"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      <div id={chartElemId} className="w-full bg-white p-1 rounded-xl overflow-x-auto scrollbar-thin">
        <div style={{ minWidth: `${dynamicMinWidth}px`, height: '210px' }}>
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            {chartType === 'line' ? (
              <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                <XAxis
                  dataKey="name"
                  stroke="#92400E"
                  tickLine={false}
                  tickFormatter={(val) => val.replace(/\s*69|\s*2569|\s*2026/g, '')}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  style={{ fontSize: '9px' }}
                />
                <YAxis stroke="#92400E" tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #FDE68A', fontSize: '11px' }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: '10px', paddingTop: '0px' }} />
                <Line type="monotone" dataKey="sold" name="ขายได้" stroke="#D97706" strokeWidth={2.5} dot={{ r: 4, fill: '#D97706' }} isAnimationActive={false} />
              </LineChart>
            ) : (
              <BarChart data={data} barCategoryGap="20%" margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                <XAxis
                  dataKey="name"
                  stroke="#92400E"
                  tickLine={false}
                  tickFormatter={(val) => val.replace(/\s*69|\s*2569|\s*2026/g, '')}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  style={{ fontSize: '9px' }}
                />
                <YAxis stroke="#92400E" tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #FDE68A', fontSize: '11px' }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: '10px', paddingBottom: '4px' }} />
                <Bar dataKey="sold" name="ขายได้" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                {data.some((d) => d.remain !== undefined) && (
                  <Bar dataKey="remain" name="คงเหลือ" fill="#9333EA" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

export default function AIInsightCard({ dashboardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rangeDays, setRangeDays] = useState(1);
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [activeChartData, setActiveChartData] = useState(null);

  const chatEndRef = useRef(null);

  const daysText = rangeDays === 1 ? 'วันนี้' : `${rangeDays} วันย้อนหลัง`;

  // 🟢 คัดสรร 3 คำถามด่วนยอดนิยม
  const dynamicQuickQuestions = [
    { label: `กราฟเปรียบเทียบภาพรวม (${daysText})`, query: `ขอกราฟเปรียบเทียบยอดขายภาพรวม (${daysText})` },
    { label: `ดูกราฟสถิติรายบุคคล`, query: `ขอดูกราฟสถิติรายบุคคลช่วง ${daysText}` },
    { label: `สรุปสินค้าเสี่ยงค้างส่ง (${daysText})`, query: `สรุปสินค้าเสี่ยงเน่าเสียหรือค้างส่ง (${daysText})` }
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const getModelDisplayName = () => {
    try {
      const url = import.meta.env.VITE_GEMINI_URL || '';
      const match = url.match(/models\/([^:]+)/);
      if (match && match[1]) {
        return match[1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
      }
    } catch (e) {
      console.error(e);
    }
    return 'Gemini AI';
  };

  const modelName = getModelDisplayName();

  useEffect(() => {
    if (chatHistory.length > 2) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading]);

  const handleDownloadChart = useCallback((elementId, title = 'chart', fullWidth = null) => {
    const node = document.getElementById(elementId);
    if (!node) return;

    const innerScrollContainer = node.querySelector('.overflow-x-auto') || node;
    const scrollChild = innerScrollContainer.firstElementChild || innerScrollContainer;

    const targetWidth = fullWidth || scrollChild.scrollWidth || innerScrollContainer.scrollWidth || node.clientWidth;

    toPng(innerScrollContainer, {
      cacheBust: true,
      backgroundColor: '#FFFFFF',
      width: targetWidth + 30,
      style: {
        overflow: 'visible',
        width: `${targetWidth + 30}px`,
        maxWidth: 'none'
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to download chart image:', err);
      });
  }, []);

  const handleMaximizeChart = useCallback((chartObj) => {
    setActiveChartData(chartObj);
  }, []);

  const handleCopySummary = async () => {
    if (!analysis) return;
    const summaryText = `📊 สรุปรายงานสถิติ PX Smart Assistant (${analysis.dateRangeText || daysText})\n` +
      `--------------------------------\n` +
      `💡 ภาพรวม: ${analysis.executiveSummary || '-'}\n\n` +
      (analysis.deadStockAlerts?.length ? `⚠️ สินค้าค้างส่ง:\n${analysis.deadStockAlerts.map(d => `• ${d}`).join('\n')}\n\n` : '') +
      (analysis.actionableSuggestions?.length ? `✨ ข้อแนะนำ:\n${analysis.actionableSuggestions.map(s => `• ${s}`).join('\n')}` : '');

    const success = await copyToClipboard(summaryText);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSendChat = useCallback(async (textToSend) => {
    if (!textToSend || !textToSend.trim() || chatLoading) return;

    const userText = textToSend.trim();

    setChatHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const aiReply = await sendChatFollowUp(chatHistory, userText, rangeDays);
      setChatHistory((prev) => [...prev, { role: 'model', text: aiReply }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'model', text: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง' }
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatHistory, chatLoading, rangeDays]);

  // 🟢 Render Markdown พร้อมรองรับ Chart & Action Chat Buttons
  const renderMarkdownText = (text, msgIdx) => {
    if (!text) return null;

    const chartRegex = /```chart\n([\s\S]*?)\n```/gi;
    const actionsRegex = /```actions\n([\s\S]*?)\n```/gi;

    const parts = [];
    let lastIndex = 0;

    // รวม Regex ตรวจทั้ง Chart และ Actions
    const combinedRegex = /```(chart|actions)\n([\s\S]*?)\n```/gi;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: match[1], content: match[2] });
      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'chart') {
        try {
          const chartObj = JSON.parse(part.content);
          if (!chartObj || !Array.isArray(chartObj.data) || chartObj.data.length === 0) {
            return null;
          }
          return (
            <ChartCardComponent
              key={pIdx}
              chartObj={chartObj}
              uniqueId={`${msgIdx}-${pIdx}`}
              onMaximize={handleMaximizeChart}
              onDownload={handleDownloadChart}
            />
          );
        } catch (e) {
          return null;
        }
      }

      if (part.type === 'actions') {
        try {
          const actionsList = JSON.parse(part.content);
          if (Array.isArray(actionsList)) {
            return (
              <div key={pIdx} className="my-2.5 pt-1 flex flex-wrap gap-1.5">
                {actionsList.map((act, aIdx) => {
                  const label = typeof act === 'string' ? act : act.label;
                  const query = typeof act === 'string' ? act : (act.query || act.label);
                  return (
                    <button
                      key={aIdx}
                      type="button"
                      onClick={() => handleSendChat(query)}
                      disabled={chatLoading}
                      className="bg-amber-50/90 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            );
          }
        } catch (e) {
          return null;
        }
      }

      const lines = part.content.split('\n');
      return lines.map((line, lineIdx) => {
        const processBold = (str) => {
          const subParts = str.split(/(\*\*.*?\*\*)/g);
          return subParts.map((subPart, spIdx) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return (
                <strong key={spIdx} className="font-bold text-gray-900">
                  {subPart.slice(2, -2)}
                </strong>
              );
            }
            return subPart;
          });
        };

        const trimmed = line.trim();

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={`${lineIdx}`} className="flex items-start gap-1.5 ml-1 my-0.5">
              <span className="text-amber-600 font-bold shrink-0">•</span>
              <span>{processBold(trimmed.slice(2))}</span>
            </div>
          );
        }

        if (trimmed === '') {
          return <div key={`${lineIdx}`} className="h-1.5" />;
        }

        return (
          <p key={`${lineIdx}`} className="my-0.5">
            {processBold(line)}
          </p>
        );
      });
    });
  };

  const handleAnalyze = async (selectedDays = rangeDays) => {
    try {
      setLoading(true);
      setError('');
      const result = await analyzeDashboardWithAI(dashboardData, selectedDays);
      setAnalysis(result);

      if (result) {
        setChatHistory([
          {
            role: 'user',
            text: result.fullContextPrompt || 'วิเคราะห์สถิติมุมมองผู้ใช้งาน'
          },
          {
            role: 'model',
            text: `สรุปภาพรวม: ${result.executiveSummary || ''}`
          }
        ]);
      }
    } catch (err) {
      console.error('handleAnalyze error:', err);
      setError(`วิเคราะห์ข้อมูลไม่สำเร็จ: ${err.message || 'โปรดตรวจสอบการเชื่อมต่อ'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsOpen(true);
    if (!analysis && !loading) {
      handleAnalyze(rangeDays);
    }
  };

  const handleRangeChange = (e) => {
    const days = Number(e.target.value);
    setRangeDays(days);
    handleAnalyze(days);
  };

  return (
    <>
      {/* Banner บน Dashboard (Warm Golden Amber) */}
      <div
        onClick={handleOpenModal}
        className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-2xs border border-amber-200/80 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group my-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl shadow-xs shadow-amber-500/20 group-hover:scale-105 transition-all">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <span>PX Smart Assistant</span>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                ระบบสวัสดิการ
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {analysis ? analysis.executiveSummary?.slice(0, 55) + '...' : 'เปิดรายงานวิเคราะห์สถิติและวาดกราฟยอดขายด้วย AI'}
            </p>
          </div>
        </div>

        <button className="bg-amber-50 hover:bg-amber-100 text-amber-800 p-2 rounded-xl border border-amber-200 transition-all shrink-0 ml-2 cursor-pointer">
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Main Full-screen Pop-up Modal (Warm Amber Theme) */}
      {isOpen && (
        <div className="fixed inset-0 top-0 left-0 w-screen h-[100dvh] z-[999] bg-white flex flex-col text-gray-800 font-sans overflow-hidden select-text">
          {/* Header Bar (Mobile Responsive Optimized) */}
          <div className="bg-white border-b border-amber-200/80 px-3 py-2.5 sm:px-4 sm:py-3.5 flex items-center justify-between sticky top-0 z-10 shrink-0 shadow-2xs gap-1.5 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl shadow-xs shadow-amber-500/20 shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-black text-gray-900 truncate leading-tight">PX Smart Assistant</h2>
                <p className="text-[10px] text-amber-900/60 font-medium truncate">ระบบประมวลผลข้อมูลสวัสดิการ ({modelName})</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Custom Bento Range Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRangeOpen(!isRangeOpen)}
                  disabled={loading}
                  className="bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-200 text-[11px] sm:text-xs font-bold rounded-xl px-2.5 py-1.5 flex items-center gap-1 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <Calendar size={12} className="text-amber-600 shrink-0" />
                  <span className="whitespace-nowrap">{rangeDays === 1 ? 'วันนี้' : `${rangeDays} วันย้อนหลัง`}</span>
                  <ChevronDown size={12} className={`text-amber-700 shrink-0 transition-transform duration-200 ${isRangeOpen ? 'rotate-180' : ''}`} />
                </button>

                {isRangeOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-amber-200 rounded-2xl shadow-xl p-1.5 min-w-[130px] space-y-1">
                    {[
                      { value: 1, label: 'วันนี้' },
                      { value: 3, label: '3 วันย้อนหลัง' },
                      { value: 7, label: '7 วันย้อนหลัง' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setRangeDays(opt.value);
                          setIsRangeOpen(false);
                          handleAnalyze(opt.value);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${rangeDays === opt.value
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-2xs'
                          : 'text-gray-700 hover:bg-amber-50 hover:text-amber-900 font-semibold'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleAnalyze(rangeDays)}
                disabled={loading}
                className="p-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 rounded-xl border border-amber-200 transition-all cursor-pointer shrink-0 shadow-2xs"
                title="วิเคราะห์ใหม่"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin text-amber-600' : 'text-amber-700'} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-amber-50 hover:bg-red-50 hover:text-red-600 active:bg-red-100 text-amber-800 rounded-xl border border-amber-200 transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 max-w-4xl mx-auto w-full select-text">
            {loading ? (
              <div className="py-20 text-center space-y-3 select-none">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-amber-800 font-bold">กำลังสรุปรายงานสถิติการขาย...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            ) : analysis ? (
              <>
                {/* Executive Summary Card with 1-Click Copy */}
                <div className="p-3.5 sm:p-4 bg-amber-50/30 rounded-2xl border border-amber-200/80 shadow-2xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 select-none">
                    {analysis.dateRangeText && (
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-200/80">
                        <Calendar size={11} className="text-amber-600 shrink-0" />
                        <span>ข้อมูลช่วง: {analysis.dateRangeText}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-white hover:bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                      title="คัดลอกสรุป AI สำหรับส่ง LINE"
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">คัดลอกแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} className="text-amber-700" />
                          <span>คัดลอกสรุป</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-gray-800 text-xs sm:text-sm font-medium leading-relaxed select-text selection:bg-amber-200 selection:text-amber-900">
                    {renderMarkdownText(analysis.executiveSummary, 'exec')}
                  </div>
                </div>

                {/* Dead Stock & Action Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {analysis.deadStockAlerts?.length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-2xs space-y-2">
                      <div className="font-bold text-amber-800 flex items-center gap-2 text-xs select-none">
                        <div className="p-1.5 bg-amber-50 rounded-xl border border-amber-200">
                          <AlertTriangle size={15} className="text-amber-600" />
                        </div>
                        <span>สินค้าเสี่ยงค้าง/จมทุน</span>
                      </div>
                      <div className="text-gray-600 space-y-1.5 leading-relaxed text-[11px] sm:text-xs select-text selection:bg-amber-200 selection:text-amber-900">
                        {analysis.deadStockAlerts.map((item, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{renderMarkdownText(item, `dead-${i}`)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.actionableSuggestions?.length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-2xs space-y-2">
                      <div className="font-bold text-emerald-800 flex items-center gap-2 text-xs select-none">
                        <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                          <Lightbulb size={15} className="text-emerald-600" />
                        </div>
                        <span>คำแนะนำปรับยอดผลิต</span>
                      </div>
                      <div className="text-gray-600 space-y-1.5 leading-relaxed text-[11px] sm:text-xs select-text selection:bg-emerald-200 selection:text-emerald-900">
                        {analysis.actionableSuggestions.map((item, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{renderMarkdownText(item, `action-${i}`)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Area */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 px-1 select-none">
                    <MessageSquare size={14} className="text-amber-600" />
                    <span>สนทนาและสั่งวาดกราฟสถิติ</span>
                  </div>

                  {chatHistory.length > 2 && (
                    <div className="space-y-3 text-xs">
                      {chatHistory.slice(2).map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                          {msg.role !== 'user' && (
                            <div className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl shrink-0 shadow-xs mt-0.5 select-none">
                              <Bot size={14} />
                            </div>
                          )}
                          <div
                            className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed select-text ${msg.role === 'user'
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-tr-none font-medium shadow-xs selection:bg-amber-700 selection:text-white'
                              : 'bg-white text-gray-800 border border-amber-200/80 rounded-tl-none shadow-2xs selection:bg-amber-200 selection:text-amber-900'
                              }`}
                          >
                            {renderMarkdownText(msg.text, idx)}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex items-center gap-2 text-amber-800 text-xs italic px-2">
                          <Bot size={14} className="animate-spin text-amber-600" />
                          <span>AI กำลังประมวลผลคำตอบ...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Bottom Fixed Input Bar (Clean 3 Quick Prompts) */}
          <div className="p-3 sm:p-4 bg-white border-t border-amber-200/80 shrink-0 space-y-2 pb-safe shadow-md">
            {/* Top 3 Dynamic Quick Chips */}
            <div className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-amber-800/80 shrink-0 font-bold">คำถามด่วน:</span>
              {dynamicQuickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(q.query)}
                  disabled={chatLoading}
                  className="bg-amber-50/90 hover:bg-amber-100 active:bg-amber-200 text-amber-900 px-3 py-1 rounded-full border border-amber-200/80 whitespace-nowrap transition-all cursor-pointer shrink-0 font-bold active:scale-95 shadow-2xs"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* ChatInputForm */}
            <ChatInputForm onSend={handleSendChat} chatLoading={chatLoading} />
          </div>
        </div>
      )}

      {/* Modal ดูกราฟขยายเต็มจอ */}
      {activeChartData && (
        <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center m-0 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 my-auto max-h-[90vh] flex flex-col border border-amber-200 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-100 pb-2.5 shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-xl shrink-0">
                  <BarChart3 size={18} />
                </div>
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                  {activeChartData.title || 'สถิติยอดขาย'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleDownloadChart('fullscreen-chart-node', activeChartData.title, Math.max((activeChartData.data?.length || 0) * 60, 360))}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs shadow-amber-500/20"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">บันทึกภาพ (.PNG)</span>
                  <span className="sm:hidden">.PNG</span>
                </button>
                <button
                  onClick={() => setActiveChartData(null)}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ส่วน Render กราฟใน Modal เต็มจอ */}
            <div id="fullscreen-chart-node" className="w-full bg-white p-2 rounded-2xl shrink-0 overflow-x-auto scrollbar-thin">
              <div style={{ minWidth: `${Math.max((activeChartData.data?.length || 0) * 60, 360)}px`, height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  {activeChartData.chartType === 'line' ? (
                    <LineChart data={activeChartData.data} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                      <XAxis
                        dataKey="name"
                        stroke="#92400E"
                        tickLine={false}
                        tickFormatter={(val) => val.replace(/\s*69|\s*2569|\s*2026/g, '')}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        style={{ fontSize: '9px' }}
                      />
                      <YAxis stroke="#92400E" tickLine={false} style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #FDE68A', fontSize: '11px' }} />
                      <Legend verticalAlign="top" wrapperStyle={{ fontSize: '10px', paddingTop: '0px' }} />
                      <Line type="monotone" dataKey="sold" name="ขายได้" stroke="#D97706" strokeWidth={2.5} dot={{ r: 4, fill: '#D97706' }} isAnimationActive={false} />
                    </LineChart>
                  ) : (
                    <BarChart data={activeChartData.data} barCategoryGap="20%" margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                      <XAxis
                        dataKey="name"
                        stroke="#92400E"
                        tickLine={false}
                        tickFormatter={(val) => val.replace(/\s*69|\s*2569|\s*2026/g, '')}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        style={{ fontSize: '9px' }}
                      />
                      <YAxis stroke="#92400E" tickLine={false} style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #FDE68A', fontSize: '11px' }} />
                      <Legend verticalAlign="top" wrapperStyle={{ fontSize: '10px', paddingBottom: '4px' }} />
                      <Bar dataKey="sold" name="ขายได้" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                      {activeChartData.data.some((d) => d.remain !== undefined) && (
                        <Bar dataKey="remain" name="คงเหลือ" fill="#9333EA" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
