/**
 * Utility สำหรับเรียกใช้ระบบสั่น (Haptic Feedback / Web Vibration API)
 * รองรับบนมือถือทั้ง Android และเบราว์เซอร์ที่รองรับ Web API
 */

export const triggerHaptic = (pattern = 50) => {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (err) {
      console.warn('Haptic vibration failed or not supported:', err);
    }
  }
};

/**
 * ⌨️ สั่นสัมผัสเบาๆ สั้นกระชับ เวลาแตะแป้นพิมพ์ตัวเลข/ตัวอักษร (เบามาก ~12-15ms)
 */
export const vibrateKeyClick = () => {
  triggerHaptic(60);
};

/**
 * ⌫ สั่นเวลาแตะปุ่มลบ/Backspace (ให้ความรู้สึกหน่วงกว่าพิมพ์เล็กน้อย ~20-25ms)
 */
export const vibrateKeyDelete = () => {
  triggerHaptic(80);
};

/**
 * สั่นเตือนเมื่อเกิด Error หรือลบไม่ได้ (สั่นเตือน 2 จังหวะ)
 */
export const vibrateError = () => {
  triggerHaptic([80, 50, 80]);
};

/**
 * สั่นเบาๆ เมื่อทำรายการสำเร็จ เช่น บันทึก หรือ คัดลอก (สั่นสั้น 1 จังหวะ)
 */
export const vibrateSuccess = () => {
  triggerHaptic(100);
};

/**
 * สั่นเตือน Warning ปานกลาง
 */
export const vibrateWarning = () => {
  triggerHaptic(120);
};