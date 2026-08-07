import sql from '../lib/neon';

// ดึงข้อมูลผู้ฝากขายทั้งหมด
export async function getSellers() {
  try {
    const data = await sql`
      SELECT * FROM sellers 
      ORDER BY sort_order ASC, id ASC
    `;
    return data;
  } catch (error) {
    console.error('Error fetching sellers:', error);
    throw error;
  }
}

// เพิ่มผู้ฝากขายใหม่
export async function createSeller(name, sortOrder) {
  try {
    const orderNum = Number(sortOrder) || 1;
    const result = await sql`
      INSERT INTO sellers (name, sort_order) 
      VALUES (${name}, ${orderNum}) 
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error creating seller:', error);
    throw error;
  }
}

// อัปเดตชื่อผู้ฝากขาย
export async function updateSeller(id, name) {
  try {
    const sellerId = Number(id);
    const result = await sql`
      UPDATE sellers 
      SET name = ${name} 
      WHERE id = ${sellerId}
      RETURNING *
    `;

    if (!result || result.length === 0) {
      throw new Error(`ไม่พบข้อมูลผู้ฝากขายรหัส ${sellerId} ในระบบ`);
    }

    return result[0];
  } catch (error) {
    console.error('Error updating seller:', error);
    throw error;
  }
}

// ลบผู้ฝากขาย (เช็กก่อนว่ามีประวัติรายงานหรือไม่)
export async function deleteSeller(id) {
  try {
    const sellerId = Number(id);

    const checkReport = await sql`
      SELECT COUNT(*) FROM reports WHERE seller_id = ${sellerId}
    `;

    if (Number(checkReport[0].count) > 0) {
      throw new Error('ไม่สามารถลบได้ เนื่องจากผู้ฝากคนนี้มีประวัติรายงานย้อนหลังในระบบแล้ว');
    }

    await sql`DELETE FROM products WHERE seller_id = ${sellerId}`;
    await sql`DELETE FROM sellers WHERE id = ${sellerId}`;

    return true;
  } catch (error) {
    console.error('Error deleting seller:', error);
    throw error;
  }
}

// อัปเดต sort_order แบบยกชุด
export async function updateSellersSortOrder(reorderedSellers) {
  try {
    const updatePromises = reorderedSellers.map((seller, index) => {
      const newOrder = index + 1;
      return sql`
        UPDATE sellers 
        SET sort_order = ${newOrder} 
        WHERE id = ${Number(seller.id)}
      `;
    });

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error updating sellers sort order:', error);
    throw error;
  }
}
