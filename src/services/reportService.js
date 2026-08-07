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
 * ดึงรายงานของวันที่ระบุ
 */
export const getTodayReport = async (reportDate) => {
  const targetDate = reportDate || getTodayThaiDate();
  try {
    const data = await sql`
      SELECT product_id, seller_id, sent, sold, remain 
      FROM reports 
      WHERE report_date = ${targetDate}::date
    `;
    return data || [];
  } catch (error) {
    console.error('Error fetching today report:', error);
    return [];
  }
};

/**
 * 🟢 ดึงยอดคงเหลือล่าสุดของวันก่อนหน้า (ยอดยกมา) แยกตามสินค้า
 */
export const getLatestPreviousReports = async (reportDate) => {
  const targetDate = reportDate || getTodayThaiDate();
  try {
    const data = await sql`
      SELECT DISTINCT ON (product_id) 
        product_id, 
        remain AS prev_remain, 
        TO_CHAR(report_date, 'YYYY-MM-DD') AS prev_date
      FROM reports
      WHERE report_date < ${targetDate}::date
      ORDER BY product_id, report_date DESC
    `;
    return data || [];
  } catch (error) {
    console.error('Error fetching latest previous reports:', error);
    return [];
  }
};

/**
 * บันทึกหรืออัปเดตรายงานประจำวัน (UPSERT)
 */
export const saveDailyReport = async (reportItems, reportDate) => {
  if (!reportItems || reportItems.length === 0) return [];

  const targetDate = reportDate || getTodayThaiDate();

  try {
    await sql`
      DELETE FROM reports 
      WHERE report_date = ${targetDate}::date
    `;

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
 * ลบรายงานประจำวันตามวันที่
 */
export const deleteDailyReportByDate = async (reportDate) => {
  try {
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
