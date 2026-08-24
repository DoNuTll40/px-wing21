/**
 * บริการตรวจสอบสิทธิ์และรหัส PIN ของผู้ดูแลระบบ (Admin Service)
 */

/**
 * ดึงความยาวของรหัส PIN ที่ตั้งค่าไว้
 * @returns {number}
 */
export const getAdminPinLength = () => {
  const adminPin = import.meta.env.VITE_ADMIN_PIN || '26032545';
  return String(adminPin).trim().length || 6;
};

/**
 * ตรวจสอบรหัส PIN สำหรับการดำเนินการของผู้ดูแลระบบ (Admin)
 * @param {string} pin รหัส PIN
 * @returns {Promise<boolean>}
 */
export const verifyAdminPin = async (pin) => {
  const adminPin = import.meta.env.VITE_ADMIN_PIN || '26032545';
  return String(pin).trim() === String(adminPin).trim();
};
