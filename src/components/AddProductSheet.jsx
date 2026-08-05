import React, { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AddProductSheet({ isOpen, onClose, onAdd, sellerId }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('ชิ้น');
  
  const [isChecking, setIsChecking] = useState(false);
  const [aiStatus, setAiStatus] = useState(null); // null | 'corrected' | 'ok' | 'error'
  const [originalName, setOriginalName] = useState('');

  if (!isOpen) return null;

  const handleCheckSpell = async () => {
    if (!name.trim() || isChecking) return;

    // 🟢 ดึงทั้ง API URL และ API KEY จาก .env (รองรับทั้ง Vite และ Create React App)
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

      // 🟢 ยิงไปที่ URL และเติม Key ตามที่กำหนดใน .env
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

      // ดึงข้อความตอบกลับจาก Gemini
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl transition-all">
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-900">เพิ่มรายการสินค้า</h3>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-700">ชื่อสินค้า</label>
              
              {/* ปุ่ม AI Spellcheck */}
              <button
                type="button"
                onClick={handleCheckSpell}
                disabled={isChecking || !name.trim()}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  isChecking
                    ? 'bg-purple-50 text-purple-600 border border-purple-200 animate-pulse'
                    : aiStatus === 'corrected'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : aiStatus === 'ok'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : aiStatus === 'error'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100 active:scale-95 disabled:opacity-50'
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
                    <span>เช็กไม่สำเร็จ</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>ตรวจคำด้วย AI</span>
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
              placeholder="เช่น แซนด์วิช, ไก่ทอด"
              className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:outline-none transition-all ${
                isChecking
                  ? 'border-purple-300 ring-2 ring-purple-100'
                  : aiStatus === 'corrected'
                  ? 'border-amber-400 ring-2 ring-amber-100'
                  : 'border-gray-200 focus:border-blue-500'
              }`}
            />

            {aiStatus === 'corrected' && (
              <p className="mt-1 text-[11px] text-amber-600">
                แก้ไขจากคำเดิม: <span className="line-through">{originalName}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">หน่วยเรียก</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="ชิ้น, ถุง, กล่อง"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isChecking}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
