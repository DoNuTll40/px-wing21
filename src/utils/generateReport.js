/**
 * สร้างข้อความรายงานประจำวันจากข้อมูล Sellers และ Products ที่ถูกกรอกยอดแล้ว
 * @param {Array} sellers รายชื่อผู้ฝากขาย
 * @param {Array} products รายการสินค้าพร้อมค่ายอด sent, sold, remain
 * @returns {string} ข้อความสรุปสำหรับส่งใน Line
 */
export const generateReportText = (sellers, products) => {
  let reportText = `รายงานยอดฝากขายประจำวัน\n\n`;

  sellers.forEach((seller) => {
    const sellerProducts = products.filter((p) => p.seller_id === seller.id);
    
    // ถ้าผู้ฝากขายคนนี้มีสินค้า
    if (sellerProducts.length > 0) {
      sellerProducts.forEach((prod, index) => {
        const sent = prod.sent || 0;
        const sold = prod.sold || 0;
        // คำนวณคงเหลือ: ถ้าไม่มีค่า remain ส่งมา ให้คำนวณจาก sent - sold
        const remain = prod.remain !== undefined && prod.remain !== '' ? prod.remain : (sent - sold);
        const unit = prod.unit || 'ชิ้น';

        // แสดงชื่อผู้ฝากขายเฉพาะรายการแรกของคนๆ นั้น (index === 0)
        const sellerLabel = index === 0 ? ` (${seller.name})` : '';

        reportText += `${prod.name}${sellerLabel}\n`;
        reportText += `ส่ง ${sent} ${unit}\n`;
        reportText += `ขาย ${sold} ${unit}\n`;
        reportText += `คงเหลือ ${remain} ${unit}\n\n`;
      });
    }
  });

  // ต่อท้ายด้วยคำว่า "ครับ" เพียงครั้งเดียวที่บรรทัดสุดท้ายของรายงาน
  reportText += `ครับ`;

  return reportText.trim();
};
