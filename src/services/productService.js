import sql from '../lib/neon';

// ดึงข้อมูลสินค้าทั้งหมด
export async function getProducts() {
  try {
    const data = await sql`
      SELECT * FROM products 
      ORDER BY sort_order ASC, id ASC
    `;
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// เพิ่มสินค้าใหม่ (รองรับ price)
export async function createProduct(sellerId, name, unit = 'ชิ้น', price = 0, sortOrder = 0) {
  try {
    const numPrice = price !== undefined && price !== '' ? Number(price) : 0;
    const result = await sql`
      INSERT INTO products (seller_id, name, unit, price, sort_order) 
      VALUES (${Number(sellerId)}, ${name}, ${unit}, ${numPrice}, ${Number(sortOrder)}) 
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// อัปเดตชื่อสินค้า, หน่วยนับ และราคา
export async function updateProduct(id, name, unit, price = 0) {
  try {
    const numPrice = price !== undefined && price !== '' ? Number(price) : 0;
    const result = await sql`
      UPDATE products 
      SET 
        name = ${name}, 
        unit = ${unit},
        price = ${numPrice}
      WHERE id = ${Number(id)}
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// ลบสินค้า (เช็กก่อนว่ามีประวัติรายงานหรือไม่)
export async function deleteProduct(id) {
  try {
    const productId = Number(id);

    // 1. เช็กว่าสินค้านี้เคยมีประวัติบันทึกในรายงานหรือไม่
    const checkReport = await sql`
      SELECT COUNT(*) FROM reports WHERE product_id = ${productId}
    `;

    if (Number(checkReport[0].count) > 0) {
      throw new Error('ไม่สามารถลบได้ เนื่องจากสินค้านี้มีประวัติรายงานย้อนหลังในระบบแล้ว (แนะนำให้ใช้การแก้ไขชื่อแทน)');
    }

    // 2. ถ้าไม่มีประวัติ จึงยอมให้ลบออกจากตาราง products
    await sql`DELETE FROM products WHERE id = ${productId}`;
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}