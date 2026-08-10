import { formatDateThai } from '../utils/formatDate';
import { getRangeAnalyticsForAI, getSpecificSellerAnalytics } from './dashboardService';
import sql from '../lib/neon';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, retries = 1, backoff = 1500) => {
  try {
    const response = await fetch(url, options);

    if (response.status === 429 && retries > 0) {
      console.warn(`[Gemini API] Rate limit hit (429). Retrying in ${backoff}ms...`);
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
    }
    throw error;
  }
};

const extractJsonObject = (text, fallbackDateText = '') => {
  if (!text) {
    return {
      dateRangeText: fallbackDateText,
      executiveSummary: 'ไม่ได้รับข้อมูลตอบกลับจาก AI กรุณาลองอีกครั้ง',
      deadStockAlerts: [],
      actionableSuggestions: []
    };
  }

  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Fallback parsing manually.');
    return {
      dateRangeText: fallbackDateText,
      executiveSummary: text.replace(/[\{\}]/g, '').trim(),
      deadStockAlerts: [],
      actionableSuggestions: []
    };
  }
};

const normalizeThaiText = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '')
    .toLowerCase()
    .trim();
};

/**
 * วิเคราะห์ข้อมูลภาพรวม
 */
export const analyzeDashboardWithAI = async (dashboardData, rangeDays = 1) => {
  const apiUrl = import.meta.env.VITE_GEMINI_URL;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('ไม่พบ VITE_GEMINI_URL หรือ VITE_GEMINI_API_KEY ในไฟล์ .env');
  }

  const fullEndpoint = `${apiUrl}?key=${apiKey}`;
  const trendData = (dashboardData?.weeklyTrend || []).slice(-rangeDays);

  let rangeDetailedStats = [];
  try {
    rangeDetailedStats = await getRangeAnalyticsForAI(rangeDays);
  } catch (err) {
    console.warn('getRangeAnalyticsForAI fallback:', err);
  }

  let dateRangeLabel = '';
  if (trendData.length > 0) {
    const startDateStr = trendData[0].date;
    const endDateStr = trendData[trendData.length - 1].date;

    if (rangeDays === 1 || startDateStr === endDateStr) {
      dateRangeLabel = formatDateThai(endDateStr, { full: true });
    } else {
      dateRangeLabel = `${formatDateThai(startDateStr)} - ${formatDateThai(endDateStr)}`;
    }
  } else {
    dateRangeLabel = formatDateThai(dashboardData?.todayDate, { full: true });
  }

  const rangeTitle = rangeDays === 1 
    ? 'ประจำวันนี้' 
    : `ยอดสะสม ${rangeDays} วันย้อนหลัง (${dateRangeLabel})`;

  const fullContextPrompt = `
คุณคือ AI ผู้ช่วยวิเคราะห์สถิติข้อมูลการขายประจำร้าน PX
กฎเหล็ก:
- อ้างอิงเฉพาะชื่อสินค้าและตัวเลขสถิติที่ปรากฏในข้อมูลด้านล่างนี้เท่านั้น
- ห้ามเดา ห้ามเมค หรือสร้างชื่อสินค้า/ตัวเลขที่ไม่ปรากฏในระบบขึ้นมาเองเด็ดขาด

ข้อมูลสถิติจริงจากระบบ PX (${rangeTitle}):
- ช่วงเวลา: ${dateRangeLabel}
- สรุปยอดขายรายวัน: ${JSON.stringify(trendData)}
- รายงานสถิติตามผู้ฝากขายจริงในระบบ: ${JSON.stringify(rangeDetailedStats)}

ตอบกลับเป็น JSON Object สั้นๆ เท่านั้น (ห้ามใส่ markdown codeblock):
{
  "dateRangeText": "${dateRangeLabel}",
  "executiveSummary": "สรุปภาพรวมการขายสะสมใน 1-2 บรรทัด",
  "deadStockAlerts": ["เตือนรายการสินค้าเสี่ยงค้าง/จมทุน ระบุชื่อสินค้าและผู้ฝากขายจริงจากระบบ"],
  "actionableSuggestions": ["ข้อเสนอแนะในการปรับยอดส่ง"]
}
`;

  try {
    const response = await fetchWithRetry(fullEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullContextPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('โควต้าโหมดฟรีประจำวันเต็มแล้ว (429 Rate Limit) กรุณาสลับใช้ API Key ใหม่ใน .env');
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    const parsed = extractJsonObject(rawText, dateRangeLabel);

    return {
      ...parsed,
      dateRangeText: dateRangeLabel
    };
  } catch (error) {
    console.error('Gemini REST API Error:', error);
    throw error;
  }
};

/**
 * 🟢 แชทโต้ตอบ - ดึงรายชื่อผู้ฝากขายทั้งหมดสดๆ จาก DB ส่งให้ AI เสมอ
 */
export const sendChatFollowUp = async (chatHistory, userMessage) => {
  const apiUrl = import.meta.env.VITE_GEMINI_URL;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('ไม่พบ VITE_GEMINI_URL หรือ VITE_GEMINI_API_KEY ในไฟล์ .env');
  }

  const fullEndpoint = `${apiUrl}?key=${apiKey}`;

  let dynamicContext = '';
  const daysMatch = userMessage.match(/(\d+)\s*วัน/);
  const targetDays = daysMatch ? parseInt(daysMatch[1], 10) : 7;

  try {
    // 🟢 1. ดึงผู้ฝากขายทุกคนที่มีอยู่ใน DB แบบไม่กรองทิ้ง
    const allSellersRes = await sql`SELECT name FROM sellers ORDER BY sort_order ASC, name ASC`;
    const allSellerNames = (allSellersRes || []).map((s) => s.name);

    // 🟢 2. สแกนหาชื่อคนที่ผู้ใช้พิมพ์ถาม
    let targetSeller = '';
    const normUserMsg = normalizeThaiText(userMessage);

    for (const seller of allSellerNames) {
      const normSeller = normalizeThaiText(seller);
      const cleanSeller = seller.replace(/^(จ่า|ผู้กอง|หมวด|นาย|นาง|นางสาว)/i, '');
      const normCleanSeller = normalizeThaiText(cleanSeller);

      if (
        normUserMsg.includes(normSeller) || 
        (normCleanSeller.length >= 2 && normUserMsg.includes(normCleanSeller))
      ) {
        targetSeller = seller;
        break;
      }
    }

    // 🟢 3. ถ้าเจอชื่อผู้ฝากขายเฉพาะเจาะจง ให้ดึงสถิติจริงของคนนั้น
    if (targetSeller) {
      const sellerData = await getSpecificSellerAnalytics(targetSeller, targetDays);
      if (sellerData.foundSeller && sellerData.stats.length > 0) {
        dynamicContext = `\n[สถิติจริงของ "${sellerData.sellerName}" ย้อนหลัง ${targetDays} วันจาก DB]:\n${JSON.stringify(sellerData.stats)}`;
      } else {
        dynamicContext = `\n[ข้อมูลในระบบ]: มีผู้ฝากขายชื่อ "${targetSeller}" ในระบบ แต่ไม่มีประวัติยอดขายย้อนหลัง ${targetDays} วัน`;
      }
    }

    // 🟢 4. ฝังรายชื่อผู้ฝากขายทั้งหมดในระบบส่งให้ AI รับรู้เสมอทุกครั้ง
    const systemSellersList = `\n[รายชื่อผู้ฝากขายทั้งหมดที่มีอยู่ในฐานข้อมูลร้าน PX ขณะนี้ (${allSellerNames.length} คน)]: ${allSellerNames.join(', ')}`;
    dynamicContext = systemSellersList + dynamicContext;

  } catch (err) {
    console.error('Error fetching context from Database:', err);
  }

  const recentHistory = (chatHistory || [])
    .filter((msg) => msg.text && !msg.text.includes('วิเคราะห์ข้อมูลการขายร้าน PX'))
    .slice(-3)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

  const strictInstruction = `
กติกาการตอบ:
1. หากผู้ใช้ถามว่ามีใครบ้าง หรือมีผู้ฝากขายคนไหนบ้าง ให้แสดงรายชื่อทั้งหมดจาก [รายชื่อผู้ฝากขายทั้งหมดที่มีอยู่ในฐานข้อมูลร้าน PX ขณะนี้] ห้ามตอบว่ามีคนเดียวเด็ดขาด!
2. ตอบด้วยภาษาไทยสุภาพ สั้น กระชับ ตรงประเด็น สไตล์ผู้ช่วยร้านสวัสดิการ PX (ลงท้ายด้วย "ครับ")
3. อ้างอิงเฉพาะชื่อคนและตัวเลขที่มีอยู่ในระบบเท่านั้น ห้ามเมคข้อมูลขึ้นมาเอง
`;

  recentHistory.push({
    role: 'user',
    parts: [{ 
      text: `${userMessage}\n${dynamicContext}\n\n${strictInstruction}` 
    }]
  });

  try {
    const response = await fetchWithRetry(fullEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: recentHistory })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('โควต้าโหมดฟรีประจำวันเต็มแล้ว (429 Rate Limit) กรุณาสลับใช้ API Key ใหม่ใน .env');
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return replyText || 'ขออภัย ไม่สามารถประมวลผลคำตอบได้ในขณะนี้';
  } catch (error) {
    console.error('Gemini FollowUp Error:', error);
    throw error;
  }
};
