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
  } catch {
    console.warn('Fallback parsing manually.');
    return {
      dateRangeText: fallbackDateText,
      executiveSummary: text.replace(/[{}]/g, '').trim(),
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

const THAI_MONTHS_MAP = {
  'มกราคม': '01', 'มกรา': '01', 'ม.ค.': '01', 'ม.ค': '01',
  'กุมภาพันธ์': '02', 'กุมภา': '02', 'ก.พ.': '02', 'ก.พ': '02',
  'มีนาคม': '03', 'มีนา': '03', 'มี.ค.': '03', 'มี.ค': '03',
  'เมษายน': '04', 'เมษา': '04', 'เม.ย.': '04', 'เม.ย': '04',
  'พฤษภาคม': '05', 'พฤษภา': '05', 'พ.ค.': '05', 'พ.ค': '05',
  'มิถุนายน': '06', 'มิถุนา': '06', 'มิ.ย.': '06', 'มิ.ย': '06',
  'กรกฎาคม': '07', 'กรกฎา': '07', 'ก.ค.': '07', 'ก.ค': '07',
  'สิงหาคม': '08', 'สิงหา': '08', 'ส.ค.': '08', 'ส.ค': '08',
  'กันยายน': '09', 'กันยา': '09', 'ก.ย.': '09', 'ก.ย': '09',
  'ตุลาคม': '10', 'ตุลา': '10', 'ต.ค.': '10', 'ต.ค': '10',
  'พฤศจิกายน': '11', 'พฤศจิกา': '11', 'พ.ย.': '11', 'พ.ย': '11',
  'ธันวาคม': '12', 'ธันวา': '12', 'ธ.ค.': '12', 'ธ.ค': '12',
};

// 🟢 ตัวแปลงวันที่ภาษาไทยจากข้อความของผู้ใช้เป็น YYYY-MM-DD (รองรับทั้ง สิงหาคม, สิงหา, ส.ค.)
const parseThaiDateFromMessage = (msg) => {
  if (!msg) return null;
  const now = new Date();
  let currentYear = now.getFullYear();

  // 1. ตรวจคำว่า "เมื่อวาน" / "เมื่อวานนี้"
  if (msg.includes('เมื่อวาน')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    return `${yYear}-${yMonth}-${yDay}`;
  }

  // 2. ตรวจจับรูปแบบ "วันที่ 8 สิงหา", "8 สิงหาคม 2569", "8 ส.ค.", "8 สิงหา"
  const dateRegex = /(?:วันที่\s*)?(\d{1,2})\s*(มกราคม|มกรา|กุมภาพันธ์|กุมภา|มีนาคม|มีนา|เมษายน|เมษา|พฤษภาคม|พฤษภา|มิถุนายน|มิถุนา|กรกฎาคม|กรกฎา|สิงหาคม|สิงหา|กันยายน|กันยา|ตุลาคม|ตุลา|พฤศจิกายน|พฤศจิกา|ธันวาคม|ธันวา|ม\.ค\.?|ก\.พ\.?|มี\.ค\.?|เม\.ย\.?|พ\.ค\.?|มิ\.ย\.?|ก\.ค\.?|ส\.ค\.?|ก\.ย\.?|ต\.ค\.?|พ\.ย\.?|ธ\.ค\.?)(?:\s*(?:พ\.ศ\.\s*)?(\d{2,4}))?/i;
  
  const match = msg.match(dateRegex);
  if (match) {
    const day = String(match[1]).padStart(2, '0');
    const monthName = match[2].trim();
    const month = THAI_MONTHS_MAP[monthName] || '08';
    
    let year = currentYear;
    if (match[3]) {
      let rawYear = parseInt(match[3], 10);
      if (rawYear > 2400) rawYear -= 543;
      if (rawYear >= 2000) year = rawYear;
    }

    return `${year}-${month}-${day}`;
  }

  return null;
};

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

  let dateRangeLabel;
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
 * 🟢 แชทโต้ตอบ - สุภาพ แม่นยำ รองรับการถามวันที่มีในระบบ และคำย่อเดือน (เช่น สิงหา)
 */
export const sendChatFollowUp = async (chatHistory, userMessage, currentSelectedRangeDays = 1) => {
  const apiUrl = import.meta.env.VITE_GEMINI_URL;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('ไม่พบ VITE_GEMINI_URL หรือ VITE_GEMINI_API_KEY ในไฟล์ .env');
  }

  const fullEndpoint = `${apiUrl}?key=${apiKey}`;

  const cleanTrimmed = userMessage.trim().toLowerCase();
  const normGreeting = normalizeThaiText(userMessage).replace(/[ๆ\s!.,~]/g, '');

  // 1. ตรวจจับข้อความทักทายทั่วไป (Greeting)
  const isGreeting = /^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|hello|hi|hey|สวัสด)/i.test(normGreeting)
    || normGreeting === 'สวัสดี' || normGreeting === 'หวัดดี' || normGreeting === 'ดีครับ' || normGreeting === 'ดีค่ะ' || cleanTrimmed === 'hello' || cleanTrimmed === 'hi';

  // 2. ตรวจจับคำถามว่าทำอะไรได้บ้าง (Capabilities)
  const isAskingCapabilities = /ทำอะไรได้บ้าง|ช่วยอะไรได้บ้าง|คุณคือใคร|แนะนำตัว|ทำไรได้/i.test(cleanTrimmed);

  // 3. ตรวจจับคำถามว่ามีข้อมูลวันไหน/วันอะไรบ้างในระบบ หรือขอดูวันอื่นๆ
  const isAskingAvailableDates = /มีข้อมูลวัน(อะไร|ไหน|ใด)|มีบันทึกวัน(อะไร|ไหน|ใด)|ดูวัน(อะไร|ไหน|ใด)ได้บ้าง|มีวันไหนบ้าง|มีประวัติวัน(อะไร|ไหน|ใด)|ข้อมูลย้อนหลังวันไหนบ้าง|ขอข้อมูลวันอื่นๆ|มีข้อมูลวันอื่น|วันอื่นๆ ได้มั้ย|วันอื่นๆ ได้ไหม|มีวันไหน/i.test(userMessage);

  let dynamicContext = '';
  let specificDate = parseThaiDateFromMessage(userMessage);
  const daysMatch = userMessage.match(/(\d+)\s*วัน/);
  const isToday = userMessage.includes('วันนี้') || userMessage.includes('ประจำวัน');
  
  // 🟢 Context Memory สำหรับวันที่: ถ้าคำถามต่อเนื่องไม่มีการระบุวัน ให้สืบทอดวันที่จากประวัติการคุยล่าสุด
  if (!specificDate && !isToday && !daysMatch && chatHistory && chatHistory.length > 0) {
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      const prevText = chatHistory[i]?.text || '';
      const foundDate = parseThaiDateFromMessage(prevText);
      if (foundDate) {
        specificDate = foundDate;
        break;
      }
    }
  }

  // ซิงค์จำนวนวัน: ถ้าผู้ใช้ระบุในข้อความให้ใช้ตามข้อความ ถ้าไม่ได้ระบุให้ใช้ตามที่เลือกใน UI Dropdown
  const targetDays = isToday ? 1 : (daysMatch ? parseInt(daysMatch[1], 10) : Number(currentSelectedRangeDays || 1));
  const daysLabel = specificDate 
    ? formatDateThai(specificDate, { full: true }) 
    : (targetDays === 1 ? 'วันนี้' : `${targetDays} วันย้อนหลัง`);

  const userExplicitlyWantsChart = userMessage.includes('กราฟ') || userMessage.includes('แผนภูมิ') || userMessage.includes('เปรียบเทียบ');

  let allSellerNames = [];
  let availableDatesList = [];
  let availableDatesThaiStr;
  let targetSeller = '';
  let mentionedUnknownSeller = '';
  let isAskingIndividualList;

  try {
    const allSellersRes = await sql`SELECT name FROM sellers ORDER BY sort_order ASC, name ASC`;
    allSellerNames = (allSellersRes || []).map((s) => s.name);

    // ดึงรายชื่อวันที่ทั้งหมดที่มีข้อมูลรายงานในฐานข้อมูล
    const distinctDatesRes = await sql`SELECT DISTINCT DATE(report_date) as d FROM reports ORDER BY d ASC`;
    availableDatesList = (distinctDatesRes || []).map(r => r.d).filter(Boolean);
    availableDatesThaiStr = availableDatesList.map(d => formatDateThai(d, { full: true })).join(', ');

    const isOverallRequest = userMessage.includes('ภาพรวม') || userMessage.includes('ทุกคน') || userMessage.includes('ทั้งหมด') || userMessage.includes('ร้าน') || userMessage.includes('ทั้งร้าน');
    isAskingIndividualList = userMessage.includes('รายบุคคล') && !userMessage.includes('ของ') && !userMessage.includes('จ่า') && !userMessage.includes('หมวด') && !userMessage.includes('ผู้กอง');

    if (!isGreeting && !isAskingCapabilities && !isAskingAvailableDates && !isOverallRequest && !isAskingIndividualList) {
      // 1. ค้นหาชื่อเต็มตรงๆ ในข้อความ (เช่น "จ่าอัด", "จ่านุ", "หมวดจิต")
      for (const seller of allSellerNames) {
        if (userMessage.includes(seller)) {
          targetSeller = seller;
          break;
        }

        // 2. ค้นหาแบบมีคำนำหน้าเจาะจง เช่น "ของอัด", "ร้านอัด", "ยอดของอัด" (บังคับต้องมีคำนำหน้า เพื่อไม่ให้คำว่า ยอดเงิน ชนกับ อัด)
        const cleanSeller = seller.replace(/^(จ่า|ผู้กอง|หมวด|นาย|นาง|นางสาว)/i, '');
        if (cleanSeller.length >= 2) {
          const pattern = new RegExp(`(?:ของ|ร้าน|ผู้ฝาก|สถิติของ|ดูของ|ยอดของ)\\s*(?:จ่า|หมวด|ผู้กอง|นาย|นาง)?\\s*${cleanSeller}`, 'i');
          if (pattern.test(userMessage)) {
            targetSeller = seller;
            break;
          }
        }
      }

      // 3. 🟢 Context Memory สำหรับชื่อคน: ใช้เฉพาะเมื่อคำถามปัจจุบันเป็นคำถามเจาะจงรายคนต่อจากคำถามก่อนหน้า (ไม่ใช่การถามวันที่ใหม่)
      const isNewDateQuery = Boolean(parseThaiDateFromMessage(userMessage));
      if (!targetSeller && !isNewDateQuery && chatHistory && chatHistory.length > 0) {
        // ตรวจเฉพาะข้อความฝั่ง user ย้อนหลัง 2 ข้อความล่าสุด
        const userMessages = chatHistory.filter(m => m.role === 'user').slice(-2);
        for (let i = userMessages.length - 1; i >= 0; i--) {
          const prevUserText = userMessages[i]?.text || '';
          for (const seller of allSellerNames) {
            if (prevUserText.includes(seller)) {
              // ถ้าข้อความปัจจุบันเป็นการถามต่อเรื่องคนเดิม เช่น "มีอะไรบ้าง", "ขายดีมั้ย", "ขอกราฟหน่อย"
              if (/สินค้า|ของ|ขายดี|เหลือ|กราฟ|อันไหน|เท่าไหร่/i.test(userMessage)) {
                targetSeller = seller;
              }
              break;
            }
          }
          if (targetSeller) break;
        }
      }

      // 4. ถ้าผู้ใช้พูดถึงชื่อคนอื่นที่ไม่มีในระบบ (เช่น จ่าสมศักดิ์, ป้าแมว)
      if (!targetSeller) {
        const rankMatch = userMessage.match(/(?:ของ|ร้าน|ผู้ฝาก)?\s*(จ่า[^\s]+|ผู้กอง[^\s]+|หมวด[^\s]+|นาย[^\s]+|นาง[^\s]+|ป้า[^\s]+|ลุง[^\s]+)/i);
        if (rankMatch && rankMatch[1]) {
          const detectedName = rankMatch[1].trim();
          if (!allSellerNames.some(s => s.includes(detectedName) || detectedName.includes(s))) {
            mentionedUnknownSeller = detectedName;
          }
        }
      }
    }

    // 🟢 1. กรณีผู้ใช้ระบุวันที่เจาะจง เช่น "วันที่ 8 สิงหา", "วันที่ 5 สิงหาคม" หรือ "เมื่อวาน"
    if (specificDate) {
      const dateReports = await sql`
        SELECT 
          COALESCE(r.seller_name_snapshot, s.name, 'ไม่ระบุ') AS seller_name,
          COALESCE(r.product_name_snapshot, p.name) AS product_name,
          COALESCE(r.unit_snapshot, p.unit, 'ชิ้น') AS unit,
          r.sent, 
          r.sold, 
          r.remain
        FROM reports r
        LEFT JOIN sellers s ON r.seller_id = s.id
        LEFT JOIN products p ON r.product_id = p.id
        WHERE DATE(r.report_date) = ${specificDate}::date
        ORDER BY s.sort_order ASC, p.sort_order ASC
      `;

      if (dateReports.length === 0) {
        dynamicContext = `\n[ผลการค้นหาจาก Database]: ในวันที่ ${daysLabel} (${specificDate}) ไม่พบประวัติการบันทึกรายงานในระบบ (ไม่มีข้อมูล)\n[วันที่ทั้งหมดที่มีข้อมูลในระบบ (${availableDatesList.length} วัน)]: ${availableDatesThaiStr}`;
      } else if (targetSeller) {
        const sellerRows = dateReports.filter(r => r.seller_name.includes(targetSeller));
        if (sellerRows.length > 0) {
          const chartData = sellerRows.map(r => ({
            name: r.product_name,
            sold: Number(r.sold || 0),
            sent: Number(r.sent || 0),
            remain: Number(r.remain || 0)
          }));
          dynamicContext = `\n[ข้อมูลจริงของ "${targetSeller}" ประจำวันที่ ${daysLabel}]:\n${JSON.stringify(chartData)}`;
        } else {
          dynamicContext = `\n[ข้อมูลในระบบ]: ในวันที่ ${daysLabel} มีรายงานในระบบ แต่ไม่มีรายการของ "${targetSeller}"`;
        }
      } else {
        const sellerTotals = {};
        dateReports.forEach(r => {
          const sName = r.seller_name;
          if (!sellerTotals[sName]) {
            sellerTotals[sName] = { name: sName, sold: 0, sent: 0, remain: 0 };
          }
          sellerTotals[sName].sold += Number(r.sold || 0);
          sellerTotals[sName].sent += Number(r.sent || 0);
          sellerTotals[sName].remain += Number(r.remain || 0);
        });

        const summaryList = Object.values(sellerTotals);
        dynamicContext = `\n[สถิติยอดขายจริงของผู้ฝากขายทุกคน ประจำวันที่ ${daysLabel}]:\n${JSON.stringify(summaryList)}\n[รายละเอียดสินค้ารายตัวของทุกคนในร้าน]:\n${JSON.stringify(dateReports)}`;
      }
    }
    // 🟢 2. กรณีถามหาคนที่ไม่มีในระบบ
    else if (mentionedUnknownSeller) {
      dynamicContext = `\n[ผลการค้นหา]: ในระบบไม่มีผู้ฝากขายชื่อ "${mentionedUnknownSeller}" (มีเพียง ${allSellerNames.join(', ')})`;
    }
    // 🟢 3. กรณีผู้ใช้ระบุชื่อคนเจาะจงที่มีอยู่จริง
    else if (targetSeller) {
      const sellerData = await getSpecificSellerAnalytics(targetSeller, targetDays);
      if (sellerData.foundSeller && sellerData.stats.length > 0) {
        dynamicContext = `\n[ข้อมูลสถิติจริงของ "${sellerData.sellerName}" ย้อนหลัง ${targetDays} วัน (${daysLabel}) จาก DB]:\n${JSON.stringify(sellerData.stats)}`;
      } else {
        dynamicContext = `\n[ข้อมูลในระบบ]: มีผู้ฝากขายชื่อ "${targetSeller}" ในระบบ แต่ไม่มีประวัติยอดขายย้อนหลัง ${targetDays} วัน (${daysLabel})`;
      }
    } 
    // 🟢 4. กรณีขอดูรายชื่อคนแบบ Action Buttons
    else if (isAskingIndividualList) {
      dynamicContext = `\n[ผู้ใช้ขอดูกราฟรายบุคคล]: ให้ส่งบล็อก \`\`\`actions สำหรับเลือกรายชื่อคน`;
    } 
    // 🟢 5. กรณีถามหาว่ามีข้อมูลวันไหนบ้าง
    else if (isAskingAvailableDates) {
      dynamicContext = `\n[รายชื่อวันที่ทั้งหมดที่มีข้อมูลในระบบ]: ${availableDatesThaiStr}`;
    }
    // 🟢 6. กรณีถามภาพรวม / วิเคราะห์สถิติต่างๆ
    else if (!isGreeting && !isAskingCapabilities) {
      const overallStats = await getRangeAnalyticsForAI(targetDays);
      
      const sellerTotals = {};
      allSellerNames.forEach(name => {
        sellerTotals[name] = { name, sold: 0, sent: 0, remain: 0 };
      });

      overallStats.forEach((item) => {
        const sName = item.seller_name;
        if (!sellerTotals[sName]) {
          sellerTotals[sName] = { name: sName, sold: 0, sent: 0, remain: 0 };
        }
        sellerTotals[sName].sold += Number(item.total_sold || 0);
        sellerTotals[sName].sent += Number(item.total_sent || 0);
        sellerTotals[sName].remain += Number(item.total_remain || 0);
      });

      const summaryList = Object.values(sellerTotals);
      dynamicContext = `\n[สถิติภาพรวมของผู้ฝากขายทุกคน (${daysLabel})]:\n${JSON.stringify(summaryList)}\n[รายละเอียดสินค้าทั้งหมด]:\n${JSON.stringify(overallStats)}`;
    }

    const systemSellersList = `\n[รายชื่อผู้ฝากขายทั้งหมดในระบบ (${allSellerNames.length} คน)]: ${allSellerNames.join(', ')}`;
    dynamicContext = systemSellersList + dynamicContext;
    if (userExplicitlyWantsChart) {
      dynamicContext += '\n[คำสั่งเพิ่มเติม]: ผู้ใช้ต้องการให้แสดงผลเป็นบล็อกกราฟ (```chart ...)';
    }

  } catch (err) {
    console.error('Error fetching context from Database:', err);
  }

  // 🕒 คำนวณวันและเวลาจริงของโลกภายนอก (Real-time Clock Context)
  const now = new Date();
  const realTodayThai = formatDateThai(now, { full: true });
  const realTodayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const realTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const latestDbDate = availableDatesList.length > 0 ? availableDatesList[availableDatesList.length - 1] : null;
  const latestDbDateThai = latestDbDate ? formatDateThai(latestDbDate, { full: true }) : 'ยังไม่มีข้อมูลบันทึก';

  // 🧠 System Instruction เพื่อสร้างบุคลิกภาพที่ฉลาดและเป็นธรรมชาติ
  const systemInstructionText = `
คุณคือ "PX Smart Assistant" ผู้ช่วยอัจฉริยะระบบข้อมูลร้านค้าสวัสดิการ กองบิน 21
บุคลิกภาพและการสนทนา:
- สุภาพ เป็นกันเอง มีไหวพริบ คล่องแคล่ว เหมือนผู้ช่วยดูแลร้านค้าสวัสดิการมืออาชีพ
- พูดคุยอย่างเป็นธรรมชาติ ตอบตรงประเด็น ไม่ใช้ประโยคท่องจำซ้ำซาก และห้ามลงท้ายด้วย "มีส่วนใดต้องการให้ช่วยวิเคราะห์ข้อมูลเพิ่มไหม" ในทุกคำตอบ ให้จบบทสนทนาอย่างพอดีและเป็นธรรมชาติ

บริบทวันเวลาและสถานะร้านค้า:
- วันและเวลาจริงของโลกภายนอก (Real-time Clock): ${realTodayThai} (${realTodayIso}) เวลาประมาณ ${realTimeStr} น.
- วันที่ที่มีข้อมูลรายงานล่าสุดในระบบ PX: ${latestDbDateThai} (${latestDbDate || 'ไม่มีข้อมูล'})
- รายชื่อผู้ฝากขายทั้งหมดในระบบ (${allSellerNames.length} คน): ${allSellerNames.join(', ')}

แนวทางการตอบ:
1. การถามเรื่องวันและเวลา:
   - หากผู้ใช้ถามว่า "วันนี้วันที่เท่าไหร่", "วันนี้วันอะไร" หรือถามวันเวลาจริง: ให้ตอบวันเวลาจริงของโลกภายนอก (${realTodayThai}) อย่างชัดเจน และแจ้งสถานะข้อมูลการขายล่าสุดในระบบ (${latestDbDateThai}) เสริมอย่างเป็นธรรมชาติ เช่น "วันนี้คือ ${realTodayThai} ครับ โดยข้อมูลยอดขายล่าสุดในระบบบันทึกไว้เมื่อ ${latestDbDateThai} ครับ"
   - หากผู้ใช้ถามถึงยอดขายหรือรายงานของ "วันนี้" (${realTodayThai}) แต่ในระบบยังไม่มีการบันทึก: ให้ชี้แจงตามตรงว่าวันนี้ยังไม่มีการบันทึกยอดขายเข้ามา และเสนอข้อมูลของวันล่าสุด (${latestDbDateThai}) ให้แทน
2. เรื่องจำนวนสินค้าและราคา:
   - ร้านค้าบันทึกราคาไว้เก็บข้อมูลเท่านั้น ห้ามพูดถึงราคาเงินบาทหรือคำนวณกำไร ให้โฟกัสที่ "จำนวนชิ้นสินค้า" เป็นหลัก (ยอดส่ง = sent, ยอดขาย = sold, ยอดคงเหลือ = remain, สัดส่วนขายได้ = sell rate)
3. การแสดงผลกราฟและปุ่มเลือก (Actions):
   - หากผู้ใช้สั่งให้วาดกราฟหรือขอดูแผนภูมิ ให้ปิดท้ายคำตอบด้วยบล็อก \`\`\`chart ... \`\`\` ในรูปแบบ JSON เสมอ:
\`\`\`chart
{
  "chartType": "bar",
  "title": "...",
  "data": [
    { "name": "...", "sold": 10, "sent": 20, "remain": 10 }
  ]
}
\`\`\`
   - หากผู้ใช้ขอดูรายชื่อผู้ฝากขายเพื่อเลือกดู ให้แนบบล็อก \`\`\`actions ... \`\`\` ในรูปแบบ JSON array เสมอ:
\`\`\`actions
[
  { "label": "ชื่อคน", "query": "ขอกราฟยอดขายของชื่อคน" }
]
\`\`\`
   - หากผู้ใช้คุยทั่วไปหรือถามวิเคราะห์สถิติ ให้ตอบเป็นข้อความ Markdown ที่อ่านง่ายและกระชับ ไม่ต้องส่งบล็อก chart หรือ actions
4. การให้คำแนะนำเชิงสถิติ:
   - สินค้าที่ยอดคงเหลือ (remain) สูงต่อเนื่อง แนะนำเรื่องการปรับลดยอดส่งหรือจัดโปรโมชั่นช่วยระบายสินค้า
   - สินค้าที่ขายดี (sold สูง หรือขายหมด 0 remain) แนะนำการเพิ่มยอดส่ง
`;

  const recentHistory = (chatHistory || [])
    .filter((msg) => msg.text && !msg.text.includes('วิเคราะห์ข้อมูลการขายร้าน PX'))
    .slice(-8)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

  recentHistory.push({
    role: 'user',
    parts: [{ 
      text: `${userMessage}${dynamicContext ? `\n\n${dynamicContext}` : ''}` 
    }]
  });

  try {
    const response = await fetchWithRetry(fullEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstructionText }]
        },
        contents: recentHistory
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
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return replyText || 'ขออภัย ไม่สามารถประมวลผลคำตอบได้ในขณะนี้';
  } catch (error) {
    console.error('Gemini FollowUp Error:', error);
    throw error;
  }
};
