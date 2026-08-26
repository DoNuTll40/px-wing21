import sql from '../lib/neon';

/**
 * ดึงประวัติรายงานย้อนหลังแบบจำกัดจำนวนวัน (Default 7 วันล่าสุดสำหรับแถบเลื่อนด่วน)
 * @param {number} limitDays จำนวนวันที่ต้องการดึง
 * @param {number} offsetDays ข้ามไปกี่วัน
 */
export const getReportHistoryGrouped = async (limitDays = 7, offsetDays = 0) => {
  try {
    // 1. ดึงรายการวันที่เฉพาะตาม Limit/Offset
    const distinctDates = await sql`
      SELECT DISTINCT report_date 
      FROM reports 
      ORDER BY report_date DESC 
      LIMIT ${limitDays} OFFSET ${offsetDays}
    `;

    if (distinctDates.length === 0) return { historyMap: {}, hasMore: false };

    const dateList = distinctDates.map((d) => d.report_date);

    // 2. ดึงข้อมูลรายงานเฉพาะวันที่อยู่ในช่วง (ดึงฟิลด์โปรโมชั่น 1 แถม 1 และราคามาให้ครบ)
    const data = await sql`
      SELECT 
        r.id,
        TO_CHAR(r.report_date, 'YYYY-MM-DD') AS formatted_date,
        r.sent,
        r.sold,
        r.remain,
        COALESCE(r.price_snapshot, p.price, 0) AS price,
        COALESCE(r.is_promo, FALSE) AS is_promo,
        COALESCE(r.free_qty, 0) AS free_qty,
        r.original_sent,
        s.id AS seller_id,
        COALESCE(r.seller_name_snapshot, s.name, 'ไม่ระบุผู้ฝาก') AS seller_name,
        p.id AS product_id,
        COALESCE(r.product_name_snapshot, p.name) AS product_name,
        COALESCE(r.unit_snapshot, p.unit, 'ชิ้น') AS unit
      FROM reports r
      LEFT JOIN sellers s ON r.seller_id = s.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.report_date = ANY(${dateList})
      ORDER BY r.report_date DESC, s.sort_order ASC, p.sort_order ASC
    `;

    const historyMap = {};

    data.forEach((item) => {
      const dateKey = item.formatted_date;
      if (!dateKey) return;
      
      if (!historyMap[dateKey]) {
        historyMap[dateKey] = {};
      }

      const sellerKey = item.seller_name || 'ไม่ระบุผู้ฝาก';
      if (!historyMap[dateKey][sellerKey]) {
        historyMap[dateKey][sellerKey] = [];
      }

      historyMap[dateKey][sellerKey].push(item);
    });

    return { 
      historyMap, 
      hasMore: distinctDates.length === limitDays 
    };
  } catch (error) {
    console.error('Error fetching grouped history:', error);
    throw error;
  }
};

/**
 * ดึงรายการวันที่ทั้งหมดที่มีข้อมูลในระบบ (สำหรับ DatePicker ปฏิทิน)
 */
export const getAllAvailableDates = async () => {
  try {
    const rows = await sql`
      SELECT DISTINCT TO_CHAR(report_date, 'YYYY-MM-DD') AS report_date
      FROM reports
      ORDER BY report_date DESC
    `;
    return rows.map((r) => r.report_date);
  } catch (error) {
    console.error('Error getting available dates:', error);
    return [];
  }
};

/**
 * ดึงข้อมูลรายงานของวันที่ระบุเจาะจง (เมื่อเลือกจาก DatePicker)
 */
export const getReportBySpecificDate = async (dateString) => {
  try {
    const data = await sql`
      SELECT 
        r.id,
        TO_CHAR(r.report_date, 'YYYY-MM-DD') AS formatted_date,
        r.sent,
        r.sold,
        r.remain,
        COALESCE(r.price_snapshot, p.price, 0) AS price,
        COALESCE(r.is_promo, FALSE) AS is_promo,
        COALESCE(r.free_qty, 0) AS free_qty,
        r.original_sent,
        s.id AS seller_id,
        COALESCE(r.seller_name_snapshot, s.name, 'ไม่ระบุผู้ฝาก') AS seller_name,
        p.id AS product_id,
        COALESCE(r.product_name_snapshot, p.name) AS product_name,
        COALESCE(r.unit_snapshot, p.unit, 'ชิ้น') AS unit
      FROM reports r
      LEFT JOIN sellers s ON r.seller_id = s.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE DATE(r.report_date) = ${dateString}::date
      ORDER BY s.sort_order ASC, p.sort_order ASC
    `;

    const dayGroup = {};
    data.forEach((item) => {
      const sellerKey = item.seller_name || 'ไม่ระบุผู้ฝาก';
      if (!dayGroup[sellerKey]) {
        dayGroup[sellerKey] = [];
      }
      dayGroup[sellerKey].push(item);
    });

    return dayGroup;
  } catch (error) {
    console.error('Error fetching specific date report:', error);
    throw error;
  }
};

/**
 * ลบประวัติรายงานตามวันที่ระบุ (ต้องมีสิทธิ์ Admin)
 * @param {string} reportDate วันที่ในรูปแบบ YYYY-MM-DD
 */
export const deleteReportByDate = async (reportDate) => {
  try {
    const result = await sql`
      DELETE FROM reports 
      WHERE DATE(report_date) = ${reportDate}::date
      RETURNING id
    `;
    return result;
  } catch (error) {
    console.error('Error deleting report by date:', error);
    throw error;
  }
};