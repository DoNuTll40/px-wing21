import sql from '../lib/neon';

// ดึงข้อมูลผู้ฝากขายทั้งหมด (เรียงตาม sort_order)
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
    const result = await sql`
      INSERT INTO sellers (name, sort_order) 
      VALUES (${name}, ${sortOrder}) 
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error creating seller:', error);
    throw error;
  }
}

// ลบผู้ฝากขาย
export async function deleteSeller(id) {
  try {
    await sql`DELETE FROM sellers WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Error deleting seller:', error);
    throw error;
  }
}

// 🟢 อัปเดต sort_order แบบยกชุดเมื่อมีการลากสลับลำดับ
export async function updateSellersSortOrder(reorderedSellers) {
  try {
    const updatePromises = reorderedSellers.map((seller, index) => {
      const newOrder = index + 1;
      return sql`
        UPDATE sellers 
        SET sort_order = ${newOrder} 
        WHERE id = ${seller.id}
      `;
    });

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error updating sellers sort order:', error);
    throw error;
  }
}
