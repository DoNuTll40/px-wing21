const SECRET_SALT = import.meta.env.VITE_SECRET_SALT;

function computeChecksum(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(36).slice(-2);
}

/**
 * สร้าง Token พร้อมวันหมดอายุ
 * @param {number|string} sellerId 
 * @param {object} permissions { kpi, prod, trend, date }
 * @param {number|null} expireDays จำนวนวันหมดอายุ (เช่น 1, 3, 7, 30 หรือ null = ไม่มีวันหมดอายุ)
 */
export function createShareToken(sellerId, { kpi = true, prod = true, trend = true, date = true } = {}, expireDays = null) {
    const mask = (kpi ? 8 : 0) | (prod ? 4 : 0) | (trend ? 2 : 0) | (date ? 1 : 0);
    const nonce = Math.random().toString(36).substring(2, 6);

    // คำนวณวันหมดอายุ (เก็บเป็น Unix Timestamp วินาที แปลงเป็น Base36 ให้สั้น)
    const expiresAt = expireDays
        ? Math.floor((Date.now() + expireDays * 24 * 60 * 60 * 1000) / 1000).toString(36)
        : '0'; // '0' หมายถึงไม่มีวันหมดอายุ

    const rawPayload = `${sellerId}:${mask}:${expiresAt}:${nonce}`;
    const checksum = computeChecksum(rawPayload);
    const fullPayload = `${rawPayload}:${checksum}`;

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(fullPayload);
    const saltBytes = encoder.encode(SECRET_SALT);

    const encryptedBytes = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
        encryptedBytes[i] = dataBytes[i] ^ saltBytes[i % saltBytes.length];
    }

    let binary = '';
    for (let i = 0; i < encryptedBytes.length; i++) {
        binary += String.fromCharCode(encryptedBytes[i]);
    }

    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * ถอดรหัส Token และเช็ควันหมดอายุ
 */
export function parseShareToken(token) {
    if (!token) return { valid: false, reason: 'missing_token' };

    try {
        let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';

        const binary = atob(base64);
        const encryptedBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            encryptedBytes[i] = binary.charCodeAt(i);
        }

        const saltBytes = new TextEncoder().encode(SECRET_SALT);
        const decryptedBytes = new Uint8Array(encryptedBytes.length);
        for (let i = 0; i < encryptedBytes.length; i++) {
            decryptedBytes[i] = encryptedBytes[i] ^ saltBytes[i % saltBytes.length];
        }

        const decodedStr = new TextDecoder().decode(decryptedBytes);
        const [sellerId, maskStr, expiresAtStr, nonce, checksum] = decodedStr.split(':');

        // ตรวจสอบ Checksum
        const rawPayload = `${sellerId}:${maskStr}:${expiresAtStr}:${nonce}`;
        if (computeChecksum(rawPayload) !== checksum) {
            return { valid: false, reason: 'invalid_checksum' };
        }

        // ตรวจสอบวันหมดอายุ
        if (expiresAtStr && expiresAtStr !== '0') {
            const expiresAtTimestamp = parseInt(expiresAtStr, 36) * 1000;
            if (Date.now() > expiresAtTimestamp) {
                return {
                    valid: false,
                    expired: true,
                    reason: 'link_expired',
                    expiredAt: new Date(expiresAtTimestamp)
                };
            }
        }

        const mask = parseInt(maskStr, 10);
        if (isNaN(mask)) return { valid: false, reason: 'invalid_mask' };

        return {
            valid: true,
            expired: false,
            sellerId: isNaN(sellerId) ? sellerId : Number(sellerId),
            showKpi: Boolean(mask & 8),
            showProducts: Boolean(mask & 4),
            showTrend: Boolean(mask & 2),
            allowDate: Boolean(mask & 1),
        };
    } catch {
        return { valid: false, reason: 'parse_error' };
    }
}