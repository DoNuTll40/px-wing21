import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, X, PackagePlus } from 'lucide-react';

export default function AddProductSheet({ isOpen, onClose, onAdd, sellerId }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('ชิ้น');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnit, setCustomUnit] = useState('');

  const [isChecking, setIsChecking] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [originalName, setOriginalName] = useState('');

  const PRESET_UNITS = ['ชิ้น', 'กล่อง', 'ถุง', 'แก้ว', 'ขวด', 'ชุด'];

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
          contents: [{ parts: [{ text: prompt }] }],
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

  const handleSelectUnit = (u) => {
    setUnit(u);
    setIsCustomUnit(false);
  };

  const handleSelectOther = () => {
    setIsCustomUnit(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalUnit = isCustomUnit
      ? (customUnit.trim() || 'ชิ้น')
      : (unit || 'ชิ้น');

    onAdd(sellerId, name.trim(), finalUnit);
    setName('');
    setUnit('ชิ้น');
    setIsCustomUnit(false);
    setCustomUnit('');
    setAiStatus(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl transition-all border border-amber-100"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 mb-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
                <PackagePlus size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  เพิ่มรายการสินค้า
                </h3>
                <p className="text-[11px] text-gray-400">ระบุชื่อสินค้าและหน่วยนับ</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* ชื่อสินค้า */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-700">ชื่อสินค้า</label>

                {/* AI Spellcheck Button */}
                <button
                  type="button"
                  onClick={handleCheckSpell}
                  disabled={isChecking || !name.trim()}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isChecking
                      ? 'bg-amber-50 text-amber-600 border border-amber-300 animate-pulse'
                      : aiStatus === 'corrected'
                        ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs font-extrabold'
                        : aiStatus === 'ok'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : aiStatus === 'error'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 active:scale-95 disabled:opacity-40'
                    }`}
                >
                  {isChecking ? (
                    <>
                      <Loader2 size={11} className="animate-spin text-amber-600" />
                      <span>กำลังตรวจ...</span>
                    </>
                  ) : aiStatus === 'corrected' ? (
                    <>
                      <Sparkles size={11} className="text-amber-600" />
                      <span>แก้คำผิดแล้ว!</span>
                    </>
                  ) : aiStatus === 'ok' ? (
                    <>
                      <CheckCircle2 size={11} />
                      <span>คำถูกต้อง</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} />
                      <span>AI ตรวจคำ</span>
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
                className="w-full px-3.5 py-2.5 border border-amber-300 hover:border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/60 rounded-xl text-sm font-medium focus:outline-none transition-all shadow-2xs"
                autoFocus
              />

              {aiStatus === 'corrected' && (
                <p className="text-[11px] text-amber-800 mt-1.5 flex items-center gap-1 font-medium bg-amber-50/70 p-1.5 rounded-lg border border-amber-200/80">
                  <span>แก้จาก:</span>
                  <span className="line-through text-gray-400 font-normal">{originalName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setName(originalName);
                      setAiStatus(null);
                    }}
                    className="text-amber-700 hover:underline ml-1 font-bold cursor-pointer"
                  >
                    (ใช้คำเดิม)
                  </button>
                </p>
              )}
            </div>

            {/* หน่วยนับ (Preset + ตัวเลือกอื่นๆ) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">หน่วยนับ</label>
                {isCustomUnit && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    (กำลังพิมพ์หน่วยนับเอง)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {PRESET_UNITS.map((u) => {
                  const isSelected = !isCustomUnit && unit === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleSelectUnit(u)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${isSelected
                          ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-2xs font-extrabold'
                          : 'border-gray-200 bg-gray-50/60 text-gray-700 hover:bg-amber-50/40'
                        }`}
                    >
                      {u}
                    </button>
                  );
                })}

                {/* ปุ่มตัวเลือก "อื่นๆ" */}
                <button
                  type="button"
                  onClick={handleSelectOther}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer col-span-2 ${isCustomUnit
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-2xs font-extrabold'
                      : 'border-gray-200 bg-gray-50/60 text-gray-700 hover:bg-amber-50/40'
                    }`}
                >
                  อื่นๆ (พิมพ์เอง)
                </button>
              </div>

              {/* ช่องพิมพ์หน่วยนับเองเมื่อเลือก "อื่นๆ" */}
              {isCustomUnit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-1"
                >
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="พิมพ์หน่วยนับ เช่น ห่อ, แพ็ค, จาน, ลูก, แท่ง..."
                    className="w-full px-3 py-2 border border-amber-400 bg-amber-50/30 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all"
                    autoFocus
                  />
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
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
                className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 disabled:opacity-40 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
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
