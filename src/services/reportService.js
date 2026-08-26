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
 * ดึงรายงานของวันที่ระบุ (รวมสถานะโหมดคำนวณและเศษโปรโมชั่น)
 */
export const getTodayReport = async (reportDate) => {
  const targetDate = reportDate || getTodayThaiDate();
  try {
    const data = await sql`
      SELECT 
        r.product_id, 
        r.seller_id, 
        COALESCE(r.seller_name_snapshot, s.name) AS seller_name,
        COALESCE(r.product_name_snapshot, p.name) AS product_name,
        COALESCE(r.unit_snapshot, p.unit, 'ชิ้น') AS unit,
        COALESCE(r.price_snapshot, p.price, 0) AS price,
        r.sent, 
        r.sold, 
        r.remain,
        COALESCE(r.is_promo, FALSE) AS is_promo,
        COALESCE(r.free_qty, 0) AS free_qty,
        r.original_sent,
        COALESCE(r.calc_mode, 'AUTO_REMAIN') AS calc_mode,
        COALESCE(r.promo_remainder, 0) AS promo_remainder
      FROM reports r
      LEFT JOIN sellers s ON r.seller_id = s.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.report_date = ${targetDate}::date
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
 * บันทึกรายงานประจำวันพร้อม Snapshot ครบทุกฟิลด์
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
      const sellerNameSnapshot = item.seller_name_snapshot ? String(item.seller_name_snapshot).trim() : null;
      const productNameSnapshot = item.product_name_snapshot ? String(item.product_name_snapshot).trim() : null;
      
      const unitValue = item.unit_snapshot || item.unit;
      const unitSnapshot = unitValue ? String(unitValue).trim() : null;

      const priceValue = item.price_snapshot ?? item.price;
      const priceSnapshot = priceValue !== undefined && priceValue !== '' ? Number(priceValue) : 0;

      const sent = Number(item.sent) || 0;
      const sold = Number(item.sold) || 0;
      const remain = item.remain !== undefined && item.remain !== ''
        ? Number(item.remain)
        : (sent - sold);

      const isPromo = Boolean(item.is_promo);
      const freeQty = isPromo ? (Number(item.free_qty) || 0) : 0;
      const originalSent = isPromo && item.original_sent !== undefined && item.original_sent !== null
        ? Number(item.original_sent)
        : null;

      const calcMode = item.calc_mode || 'AUTO_REMAIN';
      const promoRemainder = isPromo ? (Number(item.promo_remainder) || 0) : 0;

      return sql`
        INSERT INTO reports (
          report_date, 
          seller_id, 
          product_id, 
          seller_name_snapshot, 
          product_name_snapshot, 
          unit_snapshot,
          price_snapshot,
          sent, 
          sold, 
          remain,
          is_promo, 
          free_qty, 
          original_sent,
          calc_mode,
          promo_remainder
        )
        VALUES (
          ${targetDate}::date, 
          ${sellerId}, 
          ${productId}, 
          ${sellerNameSnapshot}, 
          ${productNameSnapshot}, 
          ${unitSnapshot},
          ${priceSnapshot},
          ${sent}, 
          ${sold}, 
          ${remain},
          ${isPromo}, 
          ${freeQty}, 
          ${originalSent},
          ${calcMode},
          ${promoRemainder}
        )
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