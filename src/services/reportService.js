import sql from '../lib/neon';

/**
 * คำนวณวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD ตามเวลาประเทศไทย (Asia/Bangkok)
 */
export const getTodayThaiDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * บันทึกหรืออัปเดตรายงานประจำวัน (UPSERT)
 */
export const saveDailyReport = async (reportItems, reportDate) => {
  if (!reportItems || reportItems.length === 0) return [];

  const targetDate = reportDate || getTodayThaiDate();

  try {
    // ลบข้อมูลเดิมของวันนั้นก่อน
    await sql`
      DELETE FROM reports 
      WHERE report_date = ${targetDate}::date
    `;

    // บันทึกรายการใหม่
    const insertPromises = reportItems.map((item) => {
      const sellerId = Number(item.seller_id);
      const productId = Number(item.product_id);
      const sent = Number(item.sent) || 0;
      const sold = Number(item.sold) || 0;
      const remain = item.remain !== undefined && item.remain !== '' 
        ? Number(item.remain) 
        : (sent - sold);

      return sql`
        INSERT INTO reports (report_date, seller_id, product_id, sent, sold, remain)
        VALUES (${targetDate}::date, ${sellerId}, ${productId}, ${sent}, ${sold}, ${remain})
        RETURNING *
      `;
    });

    const results = await Promise.all(insertPromises);
    return results.map((res) => res[0]);
  } catch (error) {
    console.error('Error in saveDailyReport:', error);
    throw error;
  }
};

/**
 * ลบรายงานประจำวันตามวันที่ (เปรียบเทียบกับ Column DATE โดยตรง)
 */
export const deleteDailyReportByDate = async (reportDate) => {
  try {
    // ตัดเอาเฉพาะ YYYY-MM-DD
    const cleanDate = String(reportDate).split('T')[0].trim();

    const result = await sql`
      DELETE FROM reports 
      WHERE report_date = ${cleanDate}::date
      RETURNING *
    `;
    
    return result;
  } catch (error) {
    console.error('Error deleting report by date:', error);
    throw error;
  }
};
