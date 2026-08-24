import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function AddProductSheet({ isOpen, onClose, onAdd, sellerId }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('ชิ้น');
  
  const [isChecking, setIsChecking] = useState(false);
  const [aiStatus, setAiStatus] = useState(null); // null | 'corrected' | 'ok' | 'error'
  const [originalName, setOriginalName] = useState('');

  if (!isOpen) return null;

  const handleCheckSpell = async () => {
    if (!name.trim() || isChecking) return;

    const apiUrl = import.meta.env.VITE_GEMINI_URL;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiUrl || !apiKey) {
      alert('กรุณาตั้งค่า VITE_GEMINI_API_URL และ VITE_GEMINI_API_KEY ในไฟล์ .env ให้ครบถ้วน');
      return;
    }

    try {
      setIsChecking(true);
      setAiStatus(null);
      setOriginalName(name);

      const prompt = `คุณคือระบบตรวจคำผิดชื่อเมนูอาหารและสินค้าภาษาไทย
จงตรวจสอบคำว่า: "${name}"
- หากคำถูกต้องแล้ว ให้ตอบกลับเฉพาะคำเดิม
- หากสะกดผิด ให้แก้ไขเป็นคำที่ถูกต้องและตอบเฉพาะคำที่แก้ไขแล้ว
- ห้ามใส่เครื่องหมายอัญประกาศ ห้ามคำอธิบายเพิ่มเติมใดๆ ทั้งสิ้น`;

      const fullEndpoint = apiUrl.includes('?key=') ? apiUrl : `${apiUrl}?key=${apiKey}`;

      const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Gemini API Error');
      }

      const correctedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (correctedText && correctedText !== name) {
        setName(correctedText);
        setAiStatus('corrected');
      } else {
        setAiStatus('ok');
      }
    } catch (error) {
      console.error('Gemini Spellcheck Error:', error);
      setAiStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(sellerId, name, unit);
    setName('');
    setUnit('ชิ้น');
    setAiStatus(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
        <motion.div 
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl transition-all"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900">เพิ่มรายการสินค้า</h3>
            <button 
              type="button" 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-700">ชื่อสินค้า</label>
                
                {/* ปุ่ม AI Spellcheck */}
                <button
                  type="button"
                  onClick={handleCheckSpell}
                  disabled={isChecking || !name.trim()}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    isChecking
                      ? 'bg-purple-50 text-purple-600 border border-purple-200 animate-pulse'
                      : aiStatus === 'corrected'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : aiStatus === 'ok'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : aiStatus === 'error'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 active:scale-95 disabled:opacity-40'
                  }`}
                >
                  {isChecking ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-purple-600" />
                      <span>กำลังตรวจสอบ...</span>
                    </>
                  ) : aiStatus === 'corrected' ? (
                    <>
                      <Sparkles size={12} className="text-amber-600" />
                      <span>แก้ไขคำผิดให้แล้ว!</span>
                    </>
                  ) : aiStatus === 'ok' ? (
                    <>
                      <CheckCircle2 size={12} />
                      <span>คำถูกต้อง</span>
                    </>
                  ) : aiStatus === 'error' ? (
                    <>
                      <AlertCircle size={12} />
                      <span>ตรวจคำไม่สำเร็จ</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      <span>AI ตรวจคำผิด</span>
                    </>
                  )}
                </button>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (aiStatus) setAiStatus(null);
                }}
                placeholder="เช่น ขนมปังปิ้งเนยนม, น้ำส้มคั้น"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:outline-none transition-all ${
                  aiStatus === 'corrected'
                    ? 'border-amber-400 bg-amber-50/20 focus:ring-2 focus:ring-amber-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
                autoFocus
              />

              {aiStatus === 'corrected' && (
                <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                  <span>แก้จาก:</span>
                  <span className="line-through text-gray-400 font-normal">{originalName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setName(originalName);
                      setAiStatus(null);
                    }}
                    className="text-blue-600 hover:underline ml-1 font-bold cursor-pointer"
                  >
                    (ใช้คำเดิม)
                  </button>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">หน่วยนับ</label>
              <div className="flex gap-2">
                {['ชิ้น', 'กล่อง', 'ถุง', 'แก้ว', 'ขวด', 'ชุด'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      unit === u
                        ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-2xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                เพิ่มสินค้า
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
