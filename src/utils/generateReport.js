import { formatDateThai } from './formatDate';

/**
 * สร้างข้อความรายงานยอดฝากขายประจำวันสำหรับคัดลอกลงไลน์/ข้อความ
 * เงื่อนไข:
 * 1. สินค้าที่ส่ง = 0 หรือไม่กรอกยอดส่ง จะถูกตัดออก ไม่นำมาแสดง
 * 2. ผู้ฝากขายคนไหนที่มียอดส่งเป็น 0 ทุกรายการ จะไม่ถูกนำมาแสดงในรายงานเลย
 */
export function generateReportText(sellers = [], products = []) {
  const todayStr = formatDateThai(new Date(), { full: true });

  let reportText = `รายงานยอดฝากขายประจำวัน\n${todayStr}\n\n`;

  // สร้าง Map ค้นหาชื่อผู้ฝากขายด้วย seller_id
  const sellerMap = {};
  sellers.forEach((s) => {
    sellerMap[String(s.id)] = s.name;
  });

  // 🟢 1. กรองเฉพาะรายการสินค้าที่มีการ "ส่ง" มากกว่า 0 เท่านั้น (sent > 0)
  const activeProducts = products.filter((p) => {
    const sentNum = Number(p.sent);
    return !isNaN(sentNum) && sentNum > 0;
  });

  // 🟢 2. ถ้าวันนี้ไม่มีสินค้าชิ้นไหนส่งเลย (หรือทุกคนส่งเป็น 0 หมด)
  if (activeProducts.length === 0) {
    return `${reportText}⚠️ ไม่มีรายการสินค้าฝากส่งในวันนี้`;
  }

  // 🟢 3. แสดงเฉพาะรายการสินค้าที่ส่ง > 0 (ทำให้คนที่ไม่ส่งอะไรเลย หรือส่ง 0 ชิ้น หายไปโดยอัตโนมัติ)
  activeProducts.forEach((product, index) => {
    const sellerName = sellerMap[String(product.seller_id)] || 'ไม่ระบุผู้ฝาก';
    const sent = Number(product.sent) || 0;
    const sold = Number(product.sold) || 0;
    const remain = product.remain !== undefined && product.remain !== '' 
      ? Number(product.remain) 
      : Math.max(0, sent - sold);
    const unit = product.unit || 'ชิ้น';

    reportText += `${product.name} (${sellerName})\n`;
    reportText += `ส่ง ${sent} ${unit}\n`;
    reportText += `ขาย ${sold} ${unit}\n`;
    reportText += `คงเหลือ ${remain} ${unit}\n`;

    // เว้นบรรทัดระหว่างรายการสินค้า
    if (index < activeProducts.length - 1) {
      reportText += `\n`;
    }
  });

  return reportText.trim();
}
