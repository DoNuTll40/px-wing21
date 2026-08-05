/**
 * แปลง Date Object หรือ Date String ให้เป็นวันที่ภาษาไทย
 * @param {Date|string} dateInput วันที่ที่ต้องการแปลง (default: วันปัจจุบัน)
 * @param {Object} options ตัวเลือกเพิ่มเติม
 * @returns {string} วันที่ฟอร์แมตไทย
 */
export const formatDateThai = (dateInput = new Date(), options = {}) => {
  const date = new Date(dateInput);
  
  // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
  if (isNaN(date.getTime())) {
    return '';
  }

  const { full = false, includeTime = false } = options;

  if (full) {
    // เช่น: วันพุธที่ 5 สิงหาคม 2569
    const formatted = new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'full',
    }).format(date);

    return formatted;
  }

  // แบบย่อ เช่น: 5 ส.ค. 2569
  const day = date.getDate();
  const monthShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ][date.getMonth()];
  const yearThai = date.getFullYear() + 543;

  let result = `${day} ${monthShort} ${yearThai}`;

  if (includeTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    result += ` เวลา ${hours}:${minutes} น.`;
  }

  return result;
};

/**
 * ดึงวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD (สำหรับบันทึก PostgreSQL DATE column)
 */
export const getTodayISODate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
