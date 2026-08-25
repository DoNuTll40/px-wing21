import sql from '../lib/neon';
import { getTodayThaiDate } from './reportService';

/**
 * ดึงข้อมูลสถิติมุมมอง Dashboard ตามวันที่กำหนด (หากไม่ระบุจะใช้วันนี้)
 */
export const getDashboardAnalytics = async (targetDate = null) => {
  const queryDate = targetDate || getTodayThaiDate();

  try {
    // 1. ภาพรวมยอดรวมของวันที่เลือก
    const todaySummary = await sql`
      SELECT 
        COALESCE(SUM(sent), 0) AS total_sent,
        COALESCE(SUM(sold), 0) AS total_sold,
        COALESCE(SUM(remain), 0) AS total_remain,
        COUNT(DISTINCT seller_id) AS active_sellers,
        COUNT(DISTINCT product_id) AS total_products
      FROM reports
      WHERE report_date = ${queryDate}::date
    `;

    // 2. จำนวนผู้ฝากขายทั้งหมดในระบบ
    const totalSellersRes = await sql`
      SELECT COUNT(*) AS total_sellers FROM sellers
    `;

    // 3. ดึงยอดผู้ฝากขายพร้อมรายชื่อสินค้าประจำวันที่เลือก
    const sellerReportData = await sql`
      SELECT 
        s.id AS seller_id,
        COALESCE(r.seller_name_snapshot, s.name) AS seller_name,
        s.sort_order,
        p.id AS product_id,
        COALESCE(r.product_name_snapshot, p.name) AS product_name,
        p.unit,
        COALESCE(r.sent, 0) AS sent,
        COALESCE(r.sold, 0) AS sold,
        COALESCE(r.remain, 0) AS remain
      FROM sellers s
      LEFT JOIN reports r ON s.id = r.seller_id AND r.report_date = ${queryDate}::date
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY s.sort_order ASC, p.sort_order ASC
    `;

    const sellerMap = {};
    sellerReportData.forEach((row) => {
      if (!sellerMap[row.seller_id]) {
        sellerMap[row.seller_id] = {
          seller_id: row.seller_id,
          seller_name: row.seller_name,
          total_sent: 0,
          total_sold: 0,
          total_remain: 0,
          products: []
        };
      }

      const sentNum = Number(row.sent);
      const soldNum = Number(row.sold);
      const remainNum = Number(row.remain);

      if (row.product_id && (sentNum > 0 || soldNum > 0 || remainNum > 0)) {
        sellerMap[row.seller_id].total_sent += sentNum;
        sellerMap[row.seller_id].total_sold += soldNum;
        sellerMap[row.seller_id].total_remain += remainNum;

        sellerMap[row.seller_id].products.push({
          product_id: row.product_id,
          product_name: row.product_name,
          unit: row.unit || 'ชิ้น',
          sent: sentNum,
          sold: soldNum,
          remain: remainNum
        });
      }
    });

    // 4. สินค้าขายดีที่สุด 5 อันดับแรก
    const topProducts = await sql`
      SELECT 
        COALESCE(r.product_name_snapshot, p.name) AS product_name,
        p.unit,
        COALESCE(r.seller_name_snapshot, s.name) AS seller_name,
        r.sent,
        r.sold,
        r.remain,
        ROUND((CAST(r.sold AS numeric) / NULLIF(CAST(r.sent AS numeric), 0)) * 100) AS sell_rate
      FROM reports r
      JOIN products p ON r.product_id = p.id
      JOIN sellers s ON r.seller_id = s.id
      WHERE r.report_date = ${queryDate}::date AND r.sold > 0
      ORDER BY (CAST(r.sold AS numeric) * (CAST(r.sold AS numeric) / NULLIF(CAST(r.sent AS numeric), 0))) DESC
      LIMIT 5
    `;

    // 5. สรุปแนวโน้มย้อนหลัง 7 วันล่าสุดที่มีการบันทึกข้อมูล
    const weeklyTrend = await sql`
      SELECT 
        TO_CHAR(report_date, 'YYYY-MM-DD') AS date,
        SUM(sent) AS total_sent,
        SUM(sold) AS total_sold,
        SUM(remain) AS total_remain
      FROM reports
      WHERE report_date IN (
        SELECT DISTINCT report_date FROM reports ORDER BY report_date DESC LIMIT 7
      )
      GROUP BY report_date
      ORDER BY report_date ASC
    `;

    return {
      todayDate: queryDate,
      summary: {
        totalSent: Number(todaySummary[0]?.total_sent || 0),
        totalSold: Number(todaySummary[0]?.total_sold || 0),
        totalRemain: Number(todaySummary[0]?.total_remain || 0),
        activeSellers: Number(todaySummary[0]?.active_sellers || 0),
        totalSellers: Number(totalSellersRes[0]?.total_sellers || 0),
        totalProducts: Number(todaySummary[0]?.total_products || 0)
      },
      sellerStats: Object.values(sellerMap),
      topProducts: topProducts || [],
      weeklyTrend: weeklyTrend || []
    };
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    throw error;
  }
};

/**
 * ดึงรายชื่อวันที่ทั้งหมดที่มีข้อมูลในระบบ (สำหรับ Dropdown เลือกวันทำรายงาน)
 */
export const getAvailableReportDates = async () => {
  try {
    const res = await sql`
      SELECT DISTINCT TO_CHAR(report_date, 'YYYY-MM-DD') AS d 
      FROM reports 
      ORDER BY d DESC
    `;
    return (res || []).map(r => String(r.d || '')).filter(Boolean);
  } catch (err) {
    console.error('Error fetching available report dates:', err);
    return [];
  }
};

/**
 * ดึงรายงานยอดสะสมแยกรายคนและรายสินค้า ย้อนหลัง N วัน
 */
export const getRangeAnalyticsForAI = async (rangeDays = 1) => {
  const today = getTodayThaiDate();

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (rangeDays - 1));
  const startDateStr = startDate.toISOString().split('T')[0];

  try {
    const rangeSellerData = await sql`
      SELECT 
        COALESCE(r.seller_name_snapshot, s.name) AS seller_name,
        COALESCE(r.product_name_snapshot, p.name) AS product_name,
        SUM(r.sent) AS total_sent,
        SUM(r.sold) AS total_sold,
        SUM(r.remain) AS total_remain,
        ROUND((SUM(r.sold)::numeric / NULLIF(SUM(r.sent), 0)::numeric) * 100) AS sell_rate
      FROM reports r
      JOIN sellers s ON r.seller_id = s.id
      JOIN products p ON r.product_id = p.id
      WHERE r.report_date >= ${startDateStr}::date
        AND r.report_date <= ${today}::date
      GROUP BY s.id, s.name, r.seller_name_snapshot, p.id, p.name, r.product_name_snapshot
      ORDER BY seller_name ASC, total_sold DESC
    `;

    return rangeSellerData || [];
  } catch (error) {
    console.error('Error fetching range analytics for AI:', error);
    return [];
  }
};

/**
 * 🟢 ดึงข้อมูลสถิติย้อนหลัง N วัน เจาะจงเฉพาะรายบุคคล
 */
export const getSpecificSellerAnalytics = async (sellerName, rangeDays = 7) => {
  const today = getTodayThaiDate();

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (rangeDays - 1));
  const startDateStr = startDate.toISOString().split('T')[0];

  const cleanTerm = sellerName
    .replace(/^(จ่า|ผู้กอง|หมวด|นาย|นาง|นางสาว)/i, '')
    .replace(/[็๊่้ํ์]/g, '')
    .trim();

  try {
    const matchedSellers = await sql`
      SELECT id, name FROM sellers 
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, '็', ''), '๊', ''), '่', ''), '้', ''), '์', '') 
            ILIKE ${'%' + cleanTerm + '%'}
         OR name ILIKE ${'%' + sellerName + '%'}
      LIMIT 1
    `;

    if (!matchedSellers || matchedSellers.length === 0) {
      return { foundSeller: false, sellerName: sellerName, stats: [] };
    }

    const seller = matchedSellers[0];

    const stats = await sql`
      SELECT 
        COALESCE(r.seller_name_snapshot, s.name) AS seller_name,
        COALESCE(r.product_name_snapshot, p.name) AS product_name,
        TO_CHAR(r.report_date, 'YYYY-MM-DD') AS date,
        COALESCE(r.sent, 0) AS sent,
        COALESCE(r.sold, 0) AS sold,
        COALESCE(r.remain, 0) AS remain,
        ROUND((COALESCE(r.sold, 0)::numeric / NULLIF(COALESCE(r.sent, 0), 0)::numeric) * 100) AS sell_rate
      FROM reports r
      JOIN sellers s ON r.seller_id = s.id
      JOIN products p ON r.product_id = p.id
      WHERE s.id = ${seller.id}
        AND r.report_date >= ${startDateStr}::date
        AND r.report_date <= ${today}::date
      ORDER BY r.report_date DESC, p.name ASC
    `;

    return {
      foundSeller: true,
      sellerName: seller.name,
      stats: stats || []
    };
  } catch (error) {
    console.error(`Error fetching analytics for seller ${sellerName}:`, error);
    return { foundSeller: false, sellerName: sellerName, stats: [] };
  }
};

/**
 * 🟢 ดึงข้อมูลแดชบอร์ดเฉพาะของผู้ฝากขาย 1 คน สำหรับหน้าแชร์เฉพาะบุคคล
 */
export const getSingleSellerDashboard = async (sellerId, targetDate = null) => {
  const queryDate = targetDate || getTodayThaiDate();
  const sId = Number(sellerId);

  try {
    // 1. ตรวจสอบข้อมูลผู้ฝากขาย
    const sellerRes = await sql`
      SELECT id, name FROM sellers WHERE id = ${sId} LIMIT 1
    `;

    if (!sellerRes || sellerRes.length === 0) {
      return { found: false, seller: null };
    }

    const seller = sellerRes[0];

    // 2. ดึงรายการสินค้าและยอดขายของวันที่เลือก
    const productRows = await sql`
      SELECT 
        p.id AS product_id,
        COALESCE(r.product_name_snapshot, p.name) AS product_name,
        p.unit,
        COALESCE(r.sent, 0) AS sent,
        COALESCE(r.sold, 0) AS sold,
        COALESCE(r.remain, 0) AS remain,
        ROUND((COALESCE(r.sold, 0)::numeric / NULLIF(COALESCE(r.sent, 0), 0)::numeric) * 100) AS sell_rate
      FROM products p
      LEFT JOIN reports r ON p.id = r.product_id AND r.report_date = ${queryDate}::date AND r.seller_id = ${sId}
      WHERE p.seller_id = ${sId}
      ORDER BY p.sort_order ASC, p.id ASC
    `;

    let totalSent = 0;
    let totalSold = 0;
    let totalRemain = 0;

    const products = (productRows || []).map((row) => {
      const sent = Number(row.sent) || 0;
      const sold = Number(row.sold) || 0;
      const remain = Number(row.remain) || 0;

      totalSent += sent;
      totalSold += sold;
      totalRemain += remain;

      return {
        product_id: row.product_id,
        product_name: row.product_name,
        unit: row.unit || 'ชิ้น',
        sent,
        sold,
        remain,
        sell_rate: sent > 0 ? Math.round((sold / sent) * 100) : 0
      };
    });

    const sellThroughRate = totalSent > 0 ? Math.round((totalSold / totalSent) * 100) : 0;

    // 3. ยอดขายย้อนหลัง 7 วันล่าสุดของผู้ฝากคนนี้
    const weeklyTrend = await sql`
      SELECT 
        TO_CHAR(report_date, 'YYYY-MM-DD') AS date,
        SUM(sent) AS total_sent,
        SUM(sold) AS total_sold,
        SUM(remain) AS total_remain
      FROM reports
      WHERE seller_id = ${sId}
        AND report_date IN (
          SELECT DISTINCT report_date FROM reports WHERE seller_id = ${sId} ORDER BY report_date DESC LIMIT 7
        )
      GROUP BY report_date
      ORDER BY report_date ASC
    `;

    // 4. วันที่ทั้งหมดที่ผู้ฝากคนนี้มีบันทึกรายงาน
    const availableDatesRes = await sql`
      SELECT DISTINCT TO_CHAR(report_date, 'YYYY-MM-DD') AS date
      FROM reports
      WHERE seller_id = ${sId}
      ORDER BY date DESC
    `;

    const availableDates = (availableDatesRes || []).map((r) => r.date);

    return {
      found: true,
      queryDate,
      seller,
      summary: {
        totalSent,
        totalSold,
        totalRemain,
        sellThroughRate,
        productCount: products.length
      },
      products,
      weeklyTrend: weeklyTrend || [],
      availableDates: availableDates.length > 0 ? availableDates : [queryDate]
    };
  } catch (error) {
    console.error(`Error fetching single seller dashboard for sellerId=${sellerId}:`, error);
    throw error;
  }
};

