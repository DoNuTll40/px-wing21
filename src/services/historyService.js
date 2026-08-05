import sql from '../lib/neon';

/**
 * ดึงประวัติรายงานย้อนหลังแบบจำกัดจำนวนวัน (Default 10 วันล่าสุด)
 * @param {number} limitDays จำนวนวันที่ต้องการดึง
 * @param {number} offsetDays ข้ามไปกี่วัน
 */
export const getReportHistoryGrouped = async (limitDays = 10, offsetDays = 0) => {
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

    // 2. ดึงข้อมูลรายงานเฉพาะวันที่อยู่ในช่วง
    const data = await sql`
      SELECT 
        r.id,
        TO_CHAR(r.report_date, 'YYYY-MM-DD') AS formatted_date,
        r.sent,
        r.sold,
        r.remain,
        s.id AS seller_id,
        s.name AS seller_name,
        p.id AS product_id,
        p.name AS product_name,
        p.unit
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
