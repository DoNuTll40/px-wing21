import sql from '../lib/neon';
import { getTodayThaiDate } from './reportService';

/**
 * ดึงข้อมูลสถิติมุมมอง Dashboard ณ เวลาปัจจุบัน
 * (สินค้ายอดนิยมคำนวณ Weighted Score: ยอดขาย * (ยอดขาย / ยอดส่ง))
 */
export const getDashboardAnalytics = async () => {
  const today = getTodayThaiDate();

  try {
    // 1. ภาพรวมยอดรวมของวันนี้
    const todaySummary = await sql`
      SELECT 
        COALESCE(SUM(sent), 0) AS total_sent,
        COALESCE(SUM(sold), 0) AS total_sold,
        COALESCE(SUM(remain), 0) AS total_remain,
        COUNT(DISTINCT seller_id) AS active_sellers,
        COUNT(DISTINCT product_id) AS total_products
      FROM reports
      WHERE report_date = ${today}::date
    `;

    // 2. จำนวนผู้ฝากขายทั้งหมดในระบบ
    const totalSellersRes = await sql`
      SELECT COUNT(*) AS total_sellers FROM sellers
    `;

    // 3. ดึงยอดผู้ฝากขายพร้อมรายชื่อสินค้าประจำวันนี้
    const sellerReportData = await sql`
      SELECT 
        s.id AS seller_id,
        s.name AS seller_name,
        s.sort_order,
        p.id AS product_id,
        p.name AS product_name,
        p.unit,
        COALESCE(r.sent, 0) AS sent,
        COALESCE(r.sold, 0) AS sold,
        COALESCE(r.remain, 0) AS remain
      FROM sellers s
      LEFT JOIN reports r ON s.id = r.seller_id AND r.report_date = ${today}::date
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY s.sort_order ASC, p.sort_order ASC
    `;

    // จัดกลุ่มสินค้าตามผู้ฝากขาย
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

    // 4. สินค้าขายดีที่สุด 5 อันดับแรก (แก้ไขการ CAST numeric เพื่อป้องกัน Integer Division 0)
    const topProducts = await sql`
      SELECT 
        p.name AS product_name,
        p.unit,
        s.name AS seller_name,
        r.sent,
        r.sold,
        r.remain,
        ROUND((CAST(r.sold AS numeric) / NULLIF(CAST(r.sent AS numeric), 0)) * 100) AS sell_rate
      FROM reports r
      JOIN products p ON r.product_id = p.id
      JOIN sellers s ON r.seller_id = s.id
      WHERE r.report_date = ${today}::date AND r.sold > 0
      ORDER BY (CAST(r.sold AS numeric) * (CAST(r.sold AS numeric) / NULLIF(CAST(r.sent AS numeric), 0))) DESC
      LIMIT 5
    `;

    // 5. สรุปแนวโน้มย้อนหลัง 7 วันล่าสุด
    const weeklyTrend = await sql`
      SELECT 
        TO_CHAR(report_date, 'YYYY-MM-DD') AS date,
        SUM(sent) AS total_sent,
        SUM(sold) AS total_sold,
        SUM(remain) AS total_remain
      FROM reports
      WHERE report_date >= (${today}::date - INTERVAL '6 days')
      GROUP BY report_date
      ORDER BY report_date ASC
    `;

    return {
      todayDate: today,
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
