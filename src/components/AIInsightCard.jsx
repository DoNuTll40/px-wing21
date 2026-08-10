import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Lightbulb, Calendar, Send, MessageSquare, Bot, X, Maximize2, HelpCircle } from 'lucide-react';
import { analyzeDashboardWithAI, sendChatFollowUp } from '../services/aiService';

export default function AIInsightCard({ dashboardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rangeDays, setRangeDays] = useState(1);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ปุ่มคำถามด่วน (Quick Suggestions)
  const quickQuestions = [
    'วิเคราะห์ของจ่าอัดย้อนหลัง 3 วัน',
    'วิเคราะห์ของจ่านุย้อนหลัง 3 วัน',
    'สรุปรายการสินค้าเสี่ยงเน่าเสีย/ค้างส่ง',
    'แนวทางปรับยอดสั่งผลิตประจำวัน'
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
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

  const handleTextareaChange = (e) => {
    const val = e.target.value;
    setChatInput(val);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }
  };

  useEffect(() => {
    if (chatHistory.length > 2) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading]);

  const renderMarkdownText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const processBold = (str) => {
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold text-amber-200">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
      };

      const trimmed = line.trim();

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-blue-400 font-bold shrink-0">•</span>
            <span>{processBold(trimmed.slice(2))}</span>
          </div>
        );
      }

      if (trimmed === '') {
        return <div key={lineIdx} className="h-1.5" />;
      }

      return (
        <p key={lineIdx} className="my-0.5">
          {processBold(line)}
        </p>
      );
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

  const handleSendChat = async (e, textToSend = null) => {
    if (e) e.preventDefault();
    const query = textToSend || chatInput;
    if (!query.trim() || chatLoading) return;

    const userText = query.trim();
    setChatInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const updatedHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(updatedHistory);
    setChatLoading(true);

    try {
      const aiReply = await sendChatFollowUp(updatedHistory, userText);
      setChatHistory((prev) => [...prev, { role: 'model', text: aiReply }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'model', text: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      {/* 1. Compact Banner */}
      <div 
        onClick={handleOpenModal}
        className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-blue-800/40 cursor-pointer hover:border-blue-500/60 transition-all group my-1 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-400/10 rounded-xl border border-amber-400/20 group-hover:scale-105 transition-transform">
            <Sparkles size={18} className="text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
              <span>PX Smart Assistant</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/20">
                ระบบสวัสดิการ
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {analysis ? analysis.executiveSummary?.slice(0, 50) + '...' : 'เปิดผู้ช่วย AI เพื่อวิเคราะห์รายงานยอดขายสวัสดิการ'}
            </p>
          </div>
        </div>

        <button className="bg-white/10 hover:bg-white/20 text-blue-100 p-2 rounded-xl border border-white/15 transition-all shrink-0 ml-2">
          <Maximize2 size={15} />
        </button>
      </div>

      {/* 2. Full-screen Pop-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col text-white font-sans">
          {/* Header Bar */}
          <div className="bg-slate-900/90 border-b border-blue-900/40 p-3.5 sm:p-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-400/10 rounded-lg border border-amber-400/20">
                <Sparkles size={16} className="text-amber-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-blue-200">PX Smart Assistant</h2>
                <p className="text-[10px] text-slate-400">ระบบผู้ช่วยวิเคราะห์ยอดขายร้านสวัสดิการ ({modelName})</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={rangeDays}
                  onChange={handleRangeChange}
                  disabled={loading}
                  className="appearance-none bg-slate-800 border border-white/20 text-white text-[11px] rounded-xl pl-2.5 pr-6 py-1.5 focus:outline-none cursor-pointer font-medium"
                >
                  <option value={1} className="bg-slate-900 text-white">วันนี้</option>
                  <option value={3} className="bg-slate-900 text-white">3 วันย้อนหลัง</option>
                  <option value={7} className="bg-slate-900 text-white">7 วันย้อนหลัง</option>
                </select>
                <Calendar size={11} className="absolute right-2 text-blue-200 pointer-events-none" />
              </div>

              <button
                onClick={() => handleAnalyze(rangeDays)}
                disabled={loading}
                className="p-1.5 bg-blue-600/50 hover:bg-blue-600 text-white rounded-xl border border-blue-400/30 transition-all cursor-pointer"
                title="วิเคราะห์ใหม่"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-amber-300' : ''} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-white/10 hover:bg-rose-600/80 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
            {loading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-blue-200 font-mono">กำลังประมวลผลข้อมูลการขายสวัสดิการ...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-950/60 rounded-2xl border border-rose-800/50 text-rose-200 text-xs leading-relaxed">
                {error}
              </div>
            ) : analysis ? (
              <>
                {/* Executive Summary */}
                <div className="p-4 bg-blue-900/30 rounded-2xl border border-blue-500/25 space-y-2 shadow-inner">
                  {analysis.dateRangeText && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-md w-fit border border-blue-400/20">
                      <Calendar size={11} />
                      <span>ข้อมูลช่วง: {analysis.dateRangeText}</span>
                    </div>
                  )}
                  <div className="text-slate-100 text-xs sm:text-sm font-medium leading-relaxed">
                    {renderMarkdownText(analysis.executiveSummary)}
                  </div>
                </div>

                {/* Dead Stock & Action Plan Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {analysis.deadStockAlerts?.length > 0 && (
                    <div className="p-3.5 bg-amber-950/30 rounded-2xl border border-amber-500/25 space-y-2">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle size={15} />
                        <span>รายการสินค้าเสี่ยงค้าง/จมทุน</span>
                      </div>
                      <div className="text-amber-100/90 space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
                        {analysis.deadStockAlerts.map((item, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{renderMarkdownText(item)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.actionableSuggestions?.length > 0 && (
                    <div className="p-3.5 bg-emerald-950/30 rounded-2xl border border-emerald-500/25 space-y-2">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Lightbulb size={15} />
                        <span>ข้อเสนอแนะในการปรับยอดผลิต</span>
                      </div>
                      <div className="text-emerald-100/90 space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
                        {analysis.actionableSuggestions.map((item, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{renderMarkdownText(item)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Stream History */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                    <MessageSquare size={14} />
                    <span>สอบถามเพิ่มเติมกับระบบ AI</span>
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
                            <div className="p-1.5 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300 shrink-0 mt-0.5">
                              <Bot size={14} />
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-md'
                                : 'bg-slate-900/80 text-slate-100 border border-white/10 rounded-tl-none shadow-md'
                            }`}
                          >
                            {renderMarkdownText(msg.text)}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex items-center gap-2 text-blue-300 text-xs italic">
                          <Bot size={14} className="animate-spin" />
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

          {/* 🟢 3. Bottom Fixed Input Bar + Quick Chips */}
          <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-blue-900/40 shrink-0 sticky bottom-0 z-10 backdrop-blur-md space-y-2">
            {/* Quick Suggestion Chips */}
            <div className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              <span className="text-slate-400 shrink-0 flex items-center gap-1">
                <HelpCircle size={11} /> คำถามด่วน:
              </span>
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleSendChat(e, q)}
                  disabled={chatLoading}
                  className="bg-white/10 hover:bg-blue-600/50 text-blue-200 hover:text-white px-2.5 py-1 rounded-full border border-white/10 whitespace-nowrap transition-all cursor-pointer shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="max-w-4xl mx-auto relative flex items-end bg-slate-800/90 border border-white/20 rounded-2xl p-1.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                rows={2}
                value={chatInput}
                onChange={handleTextareaChange}
                placeholder="พิมพ์ข้อความสอบถาม AI... (เช่น สรุปยอดขายของจ่าอัดย้อนหลัง 3 วัน)"
                disabled={chatLoading}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none resize-none min-h-[48px] max-h-[140px] leading-relaxed overflow-y-auto"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white p-2.5 rounded-xl disabled:opacity-30 transition-all cursor-pointer shrink-0 shadow-sm mb-0.5 mr-0.5 flex items-center justify-center"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
