/**
 * ยิง Gemini REST API ผ่าน VITE_GEMINI_URL และ VITE_GEMINI_API_KEY ใน .env
 */
export const analyzeDashboardWithAI = async (dashboardData) => {
  const apiUrl = import.meta.env.VITE_GEMINI_URL;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('กรุณาตั้งค่า VITE_GEMINI_URL และ VITE_GEMINI_API_KEY ในไฟล์ .env');
  }

  // ต่อ Query Param key เข้ากับ URL Endpoint
  const fullEndpoint = `${apiUrl}?key=${apiKey}`;

  const prompt = `
คุณคือ AI นักวิเคราะห์ข้อมูลการขายประจำร้าน PX หน่วยฝึกฯ
โปรดวิเคราะห์ข้อมูลการขายประจำวันนี้อย่างชาญฉลาด สั้น กระชับ และเป็นกันเองสไตล์เพื่อนคู่คิด

ข้อมูลการขายวันนี้:
- ยอดส่งรวม: ${dashboardData?.summary?.totalSent || 0} ชิ้น
- ยอดขายรวม: ${dashboardData?.summary?.totalSold || 0} ชิ้น
- ยอดเหลือรวม: ${dashboardData?.summary?.totalRemain || 0} ชิ้น
- อัตราขายได้รวม: ${dashboardData?.summary?.totalSent > 0 ? Math.round((dashboardData?.summary?.totalSold / dashboardData?.summary?.totalSent) * 100) : 0}%
- 5 สินค้าขายดี: ${JSON.stringify(dashboardData?.topProducts || [])}
- รายงานแยกตามผู้ฝาก: ${JSON.stringify(dashboardData?.sellerStats || [])}

ตอบกลับเป็นภาษาไทย โดยให้ผลลัพธ์เป็น JSON Object แบบนี้เท่านั้น (ไม่ต้องใส่ markdown codeblock หรือตัวอักษรอื่น):
{
  "executiveSummary": "สรุปภาพรวมใน 1-2 บรรทัด",
  "highlights": ["ไฮไลท์ที่ 1", "ไฮไลท์ที่ 2"],
  "deadStockAlerts": ["เตือนสินค้าเสี่ยงเหลือ/จมทุน"],
  "actionableSuggestions": ["คำแนะนำในการปรับยอดส่งวันถัดไป"]
}
`;

  try {
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('ไม่ได้รับข้อมูลการตอบกลับจาก AI');
    }

    // แปลง Text JSON ให้เป็น Object
    const cleanedJsonText = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedJsonText);
  } catch (error) {
    console.error('Gemini REST API Error:', error);
    throw error;
  }
};
