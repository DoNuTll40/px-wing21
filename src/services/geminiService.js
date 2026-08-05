/**
 * ตรวจและแก้ไขคำสะกดผิดของชื่อสินค้าภาษาไทยด้วย Gemini API
 * @param {string} productName ชื่อสินค้าที่ต้องการตรวจ
 * @returns {Promise<string>} ชื่อสินค้าที่แก้ไขแล้ว
 */
export const correctProductName = async (productName) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is not defined");
    return productName;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `คุณคือตัวช่วยสะกดคำภาษาไทยสำหรับสินค้าในร้านค้า PX 
หน้าที่: แก้ไขคำสะกดผิด ฟุ่มเฟือย หรือพิมพ์ตก ของชื่อสินค้าให้เป็นคำภาษาไทยที่ถูกต้อง สั้นกระชับ และเป็นธรรมชาติ
ข้อบังคับ: ตอบเฉพาะชื่อสินค้าที่แก้ไขแล้วเท่านั้น ห้ามมีคำอธิบาย ห้ามมีเครื่องหมายเปิดปิด หรือสัญลักษณ์อื่นใด

ชื่อสินค้า: "${productName}"`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    const correctedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return correctedText || productName;
  } catch (err) {
    console.error("Gemini API Error:", err);
    return productName;
  }
};
