import { formatDateThai } from './formatDate';

/**
 * สร้างข้อความรายงานยอดฝากขายประจำวันสำหรับคัดลอก
 * - จัดกลุ่มเรียงตามรายชื่อผู้ฝากขาย (sellers)
 * - แสดงชื่อผู้ฝากวงเล็บเฉพาะสินค้า "ตัวแรก" ในกลุ่มของคนนั้นๆ
 * - ตัดรายการที่ส่งเป็น 0 หรือไม่ส่งออกอัตโนมัติ
 */
export function generateReportText(sellers = [], products = []) {
  const todayStr = formatDateThai(new Date(), { full: true });

  let reportText = `📋 รายงานยอดฝากขายประจำวัน\n📅 วันที่: ${todayStr}\n\n`;

  const reportBlocks = [];

  // 🟢 1. วนลูปเรียงตามรายชื่อผู้ฝากขายก่อน
  sellers.forEach((seller) => {
    // ดึงเฉพาะสินค้าของผู้ฝากขายคนนี้ที่มีการ "ส่ง" > 0
    const activeProducts = products.filter((p) => {
      const isMyProduct = String(p.seller_id) === String(seller.id);
      const sentNum = Number(p.sent);
      return isMyProduct && !isNaN(sentNum) && sentNum > 0;
    });

    // 🟢 2. วนลูปสินค้าของผู้ฝากคนนี้ (ถ้ามี)
    activeProducts.forEach((product, idx) => {
      const sent = Number(product.sent) || 0;
      const sold = Number(product.sold) || 0;
      const remain = product.remain !== undefined && product.remain !== '' 
        ? Number(product.remain) 
        : Math.max(0, sent - sold);
      const unit = product.unit || 'ชิ้น';

      // 🟢 3. แสดงชื่อผู้ฝากเฉพาะสินค้าตัวแรกของกลุ่ม (idx === 0)
      const titleLine = idx === 0 
        ? `${product.name} (${seller.name})` 
        : `${product.name}`;

      let itemText = `${titleLine}\n`;
      itemText += `ส่ง ${sent} ${unit}\n`;
      itemText += `ขาย ${sold} ${unit}\n`;
      itemText += `คงเหลือ ${remain} ${unit}`;

      reportBlocks.push(itemText);
    });
  });

  // กรณีไม่มีการฝากส่งสินค้าเลยในวันนี้
  if (reportBlocks.length === 0) {
    return `${reportText}⚠️ ไม่มีรายการสินค้าฝากส่งในวันนี้`;
  }

  return reportText + reportBlocks.join('\n\n');
}
