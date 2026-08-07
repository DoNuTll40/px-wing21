import { formatDateThai } from './formatDate';

/**
 * สร้างข้อความรายงานยอดฝากขายประจำวันสำหรับคัดลอกลงไลน์/ข้อความ
 * (กรองเฉพาะผู้ฝากขายที่มีการลงยอดส่งหรือขายในวันนี้เท่านั้น)
 */
export function generateReportText(sellers = [], products = []) {
  const todayStr = formatDateThai(new Date(), { full: true });

  let reportText = `📊 รายงานยอดฝากขายประจำวัน\n📅 ${todayStr}\n------------------------------\n`;

  // 🟢 1. กรองเฉพาะผู้ฝากขายที่มีอย่างน้อย 1 รายการสินค้าถูกคีย์ยอด (ส่ง > 0 หรือ ขาย > 0)
  const activeSellers = sellers.filter((seller) => {
    const sellerProducts = products.filter(
      (p) => String(p.seller_id) === String(seller.id)
    );

    return sellerProducts.some((p) => {
      const sentNum = Number(p.sent) || 0;
      const soldNum = Number(p.sold) || 0;
      return sentNum > 0 || soldNum > 0;
    });
  });

  // ถ้าไม่มีใครลงยอดเลยในวันนี้
  if (activeSellers.length === 0) {
    return `${reportText}\n⚠️ ยังไม่มีการบันทึกยอดฝากขายประจำวันนี้`;
  }

  // 🟢 2. วนลูปสร้างข้อความเฉพาะผู้ฝากขายที่มียอด
  activeSellers.forEach((seller, index) => {
    reportText += `\n👤 ${index + 1}. ${seller.name}\n`;

    const sellerProducts = products.filter(
      (p) => String(p.seller_id) === String(seller.id)
    );

    // กรองเอาเฉพาะสินค้าที่มีการป้อนยอดส่งหรือขาย
    const validProducts = sellerProducts.filter((p) => {
      const sentNum = Number(p.sent) || 0;
      const soldNum = Number(p.sold) || 0;
      return sentNum > 0 || soldNum > 0;
    });

    validProducts.forEach((product) => {
      const sent = Number(product.sent) || 0;
      const sold = Number(product.sold) || 0;
      const remain = product.remain !== undefined && product.remain !== '' 
        ? Number(product.remain) 
        : Math.max(0, sent - sold);
      const unit = product.unit || 'ชิ้น';

      reportText += `   - ${product.name}: ส่ง ${sent} | ขาย ${sold} | เหลือ ${remain} ${unit}\n`;
    });
  });

  reportText += `\n------------------------------\n✅ บันทึกรายงานเรียบร้อยแล้ว`;

  return reportText;
}
