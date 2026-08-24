import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Lightbulb, Calendar, Send, MessageSquare, Bot, X, Maximize2, HelpCircle, BarChart3, Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { toPng } from 'html-to-image';
import { analyzeDashboardWithAI, sendChatFollowUp } from '../services/aiService';

// 🟢 1. แยกคอมโพเนนต์ช่องพิมพ์ข้อความอิสระ (พิมพ์ลื่นไม่กระตุก ไม่ส่งผลต่อการ์ดกราฟ)
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
        // คอมพิวเตอร์: Enter เพื่อส่ง
        e.preventDefault();
        handleSubmit(e);
      }
      // มือถือ: Enter ลงบรรทัดใหม่
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-end bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
      <textarea
        rows={2} // 🟢 เพิ่มความสูงเริ่มต้นขึ้นอีก 1 บรรทัด (2 บรรทัด)
        value={inputValue}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        placeholder="พิมพ์ข้อความสอบถาม AI... (คอมฯ กด Enter เพื่อส่ง)"
        disabled={chatLoading}
        className="flex-1 bg-transparent px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none min-h-[56px] max-h-[130px] leading-relaxed overflow-y-auto"
      />
      <button
        type="submit"
        disabled={!inputValue.trim() || chatLoading}
        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-2.5 rounded-xl disabled:opacity-30 transition-all cursor-pointer shrink-0 shadow-sm mb-0.5 mr-0.5 flex items-center justify-center"
      >
        <Send size={15} />
      </button>
    </form>
  );
});

// 🟢 2. คอมโพเนนต์กราฟแบบ Scroll X
const ChartCardComponent = memo(({ chartObj, uniqueId, onMaximize, onDownload }) => {
  const { chartType, title, data } = chartObj;
  if (!data || data.length === 0) return null;

  const chartElemId = `chart-card-${uniqueId}`;
  const dynamicMinWidth = Math.max((data?.length || 0) * 55, 320);

  return (
    <div className="my-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 min-w-0">
          <BarChart3 size={15} className="text-blue-600 shrink-0" />
          <span className="truncate">{title || 'กราฟสรุปสถิติ'}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onMaximize({ ...chartObj, id: chartElemId })}
            className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl transition-all cursor-pointer"
            title="ดูขยายเต็มจอ"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={() => onDownload(chartElemId, title, dynamicMinWidth)}
            className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-xl transition-all cursor-pointer"
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  tickLine={false} 
                  tickFormatter={(val) => val.replace(/\s*69|\s*2569|\s*2026/g, '')}
                  interval={0} 
                  angle={-20} 
                  textAnchor="end" 
                  style={{ fontSize: '9px' }} 
                />
                <YAxis stroke="#64748B" tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: '10px', paddingTop: '0px' }} />
                <Line type="monotone" dataKey="sold" name="ขายได้" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />
              </LineChart>
            ) : (
              <BarChart data={data} barCategoryGap="20%" margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  tickLine={false} 
                  tickFormatter={(val) => val.replace(/\s*69|\s*2569|\s*2026/g, '')}
                  interval={0} 
                  angle={-20} 
                  textAnchor="end" 
                  style={{ fontSize: '9px' }} 
                />
                <YAxis stroke="#64748B" tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: '10px', paddingBottom: '4px' }} />
                <Bar dataKey="sold" name="ขายได้" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                {data[0]?.remain !== undefined && (
                  <Bar dataKey="remain" name="คงเหลือ" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
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
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [activeChartData, setActiveChartData] = useState(null);

  const chatEndRef = useRef(null);

  const allSellers = (dashboardData?.sellerStats || []).map((s) => s.seller_name).filter(Boolean);
  const activeSellerNames = allSellers.slice(0, 3);
  const daysText = rangeDays === 1 ? 'วันนี้' : `${rangeDays} วันย้อนหลัง`;

  const dynamicQuickQuestions = [
    `ขอกราฟเปรียบเทียบยอดขายภาพรวม (${daysText})`,
    ...activeSellerNames.map((name) => `ขอกราฟยอดขายของ${name}`),
    `สรุปสินค้าเสี่ยงเน่าเสีย/ค้างส่ง (${daysText})`
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

  const renderMarkdownText = (text, msgIdx) => {
    if (!text) return null;

    const chartRegex = /```chart\n([\s\S]*?)\n```/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = chartRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'chart', content: match[1] });
      lastIndex = chartRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'chart') {
        try {
          const chartObj = JSON.parse(part.content);
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

      const lines = part.content.split('\n');
      return lines.map((line, lineIdx) => {
        const processBold = (str) => {
          const subParts = str.split(/(\*\*.*?\*\*)/g);
          return subParts.map((subPart, spIdx) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return (
                <strong key={spIdx} className="font-semibold text-slate-900">
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
              <span className="text-blue-600 font-bold shrink-0">•</span>
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

  const handleSendChat = useCallback(async (textToSend) => {
    if (!textToSend || !textToSend.trim() || chatLoading) return;

    const userText = textToSend.trim();

    setChatHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const aiReply = await sendChatFollowUp(chatHistory, userText);
      setChatHistory((prev) => [...prev, { role: 'model', text: aiReply }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'model', text: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง' }
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatHistory, chatLoading]);

  return (
    <>
      {/* Banner บน Dashboard */}
      <div 
        onClick={handleOpenModal}
        className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group my-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>PX Smart Assistant</span>
              <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                ระบบสวัสดิการ
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {analysis ? analysis.executiveSummary?.slice(0, 50) + '...' : 'เปิดรายงานวิเคราะห์สถิติและวาดกราฟยอดขาย'}
            </p>
          </div>
        </div>

        <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-2 rounded-xl border border-slate-200 transition-all shrink-0 ml-2">
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Main Full-screen Pop-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 top-0 left-0 w-screen h-[100dvh] z-[999] bg-slate-50 flex flex-col text-slate-800 font-sans overflow-hidden">
          {/* Header Bar */}
          <div className="bg-white border-b border-slate-200 p-3.5 sm:p-4 flex items-center justify-between sticky top-0 z-10 shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-800">PX Smart Assistant</h2>
                <p className="text-[10px] text-slate-500">ระบบประมวลผลข้อมูลสวัสดิการ ({modelName})</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={rangeDays}
                  onChange={handleRangeChange}
                  disabled={loading}
                  className="appearance-none bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-xl pl-3 pr-7 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value={1}>วันนี้</option>
                  <option value={3}>3 วันย้อนหลัง</option>
                  <option value={7}>7 วันย้อนหลัง</option>
                </select>
                <Calendar size={12} className="absolute right-2.5 text-slate-400 pointer-events-none" />
              </div>

              <button
                onClick={() => handleAnalyze(rangeDays)}
                disabled={loading}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl border border-slate-200 transition-all cursor-pointer ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-medium">กำลังสรุปรายงานสถิติการขาย...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            ) : analysis ? (
              <>
                {/* Executive Summary */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  {analysis.dateRangeText && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full w-fit border border-blue-100">
                      <Calendar size={11} />
                      <span>ข้อมูลช่วง: {analysis.dateRangeText}</span>
                    </div>
                  )}
                  <div className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                    {renderMarkdownText(analysis.executiveSummary, 'exec')}
                  </div>
                </div>

                {/* Dead Stock & Action Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {analysis.deadStockAlerts?.length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                      <div className="font-bold text-amber-700 flex items-center gap-2 text-xs">
                        <div className="p-1.5 bg-amber-50 rounded-xl border border-amber-100">
                          <AlertTriangle size={15} className="text-amber-600" />
                        </div>
                        <span>สินค้าเสี่ยงค้าง/จมทุน</span>
                      </div>
                      <div className="text-slate-600 space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
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
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                      <div className="font-bold text-emerald-700 flex items-center gap-2 text-xs">
                        <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                          <Lightbulb size={15} className="text-emerald-600" />
                        </div>
                        <span>คำแนะนำปรับยอดผลิต</span>
                      </div>
                      <div className="text-slate-600 space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
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
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 px-1">
                    <MessageSquare size={14} className="text-blue-600" />
                    <span>สนทนาและสั่งวาดกราฟสถิติ</span>
                  </div>

                  {chatHistory.length > 2 && (
                    <div className="space-y-3 text-xs">
                      {chatHistory.slice(2).map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 ${
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {msg.role !== 'user' && (
                            <div className="p-2 bg-blue-600 text-white rounded-2xl shrink-0 shadow-sm mt-0.5">
                              <Bot size={14} />
                            </div>
                          )}
                          <div
                            className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-sm'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                            }`}
                          >
                            {renderMarkdownText(msg.text, idx)}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs italic px-2">
                          <Bot size={14} className="animate-spin text-blue-600" />
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

          {/* Bottom Fixed Input Bar */}
          <div className="p-3 sm:p-4 bg-white/95 border-t border-slate-200 shrink-0 space-y-2 pb-safe shadow-md">
            {allSellers.length > 0 && (
              <div className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                <span className="text-slate-400 shrink-0 font-medium">เลือกคน:</span>
                {allSellers.map((sName, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleSendChat(`ขอกราฟสถิติของ${sName}ช่วง ${daysText}`)}
                    className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-2.5 py-0.5 rounded-lg border border-slate-200 transition-all cursor-pointer font-medium whitespace-nowrap shrink-0 active:scale-95"
                  >
                    {sName}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Chips */}
            <div className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              <span className="text-slate-400 shrink-0 flex items-center gap-1 font-medium">
                <HelpCircle size={11} /> คำถามด่วน:
              </span>
              {dynamicQuickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(q)}
                  disabled={chatLoading}
                  className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap transition-all cursor-pointer shrink-0 font-medium active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 🟢 ใช้ ChatInputForm คอมโพเนนต์แยกเพื่อป้องกัน Re-render ทั้งหน้ากระตุก */}
            <ChatInputForm onSend={handleSendChat} chatLoading={chatLoading} />
          </div>
        </div>
      )}

      {/* Modal ดูกราฟขยายเต็มจอ */}
      {activeChartData && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 my-auto max-h-[90vh] flex flex-col border border-slate-100 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <BarChart3 size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                  {activeChartData.title || 'สถิติยอดขาย'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleDownloadChart('fullscreen-chart-node', activeChartData.title, Math.max((activeChartData.data?.length || 0) * 60, 360))}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">บันทึกภาพ (.PNG)</span>
                  <span className="sm:hidden">.PNG</span>
                </button>
                <button
                  onClick={() => setActiveChartData(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748B" 
                        tickLine={false} 
                        tickFormatter={(val) => val.replace(/\s*69|\s*2569|\s*2026/g, '')}
                        interval={0} 
                        angle={-20} 
                        textAnchor="end" 
                        style={{ fontSize: '9px' }} 
                      />
                      <YAxis stroke="#64748B" tickLine={false} style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                      <Legend verticalAlign="top" wrapperStyle={{ fontSize: '10px', paddingTop: '0px' }} />
                      <Line type="monotone" dataKey="sold" name="ขายได้" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />
                    </LineChart>
                  ) : (
                    <BarChart data={activeChartData.data} barCategoryGap="20%" margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748B" 
                        tickLine={false} 
                        tickFormatter={(val) => val.replace(/\s*69|\s*2569|\s*2026/g, '')}
                        interval={0} 
                        angle={-20} 
                        textAnchor="end" 
                        style={{ fontSize: '9px' }} 
                      />
                      <YAxis stroke="#64748B" tickLine={false} style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                      <Legend verticalAlign="top" wrapperStyle={{ fontSize: '10px', paddingBottom: '4px' }} />
                      <Bar dataKey="sold" name="ขายได้" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                      {activeChartData.data[0]?.remain !== undefined && (
                        <Bar dataKey="remain" name="คงเหลือ" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
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
