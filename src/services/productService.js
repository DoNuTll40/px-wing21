import sql from '../lib/neon';

export const getProducts = async () => {
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
};

export const createProduct = async (sellerId, name, unit = 'ชิ้น', sortOrder = 0) => {
  try {
    const data = await sql`
      INSERT INTO products (seller_id, name, unit, sort_order) 
      VALUES (${sellerId}, ${name}, ${unit}, ${sortOrder}) 
      RETURNING *
    `;
    return data[0];
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    // 1. ลบประวัติในตาราง reports ที่อ้างอิง product_id นี้ก่อน
    await sql`DELETE FROM reports WHERE product_id = ${id}`;

    // 2. ลบสินค้าออกจากตาราง products
    await sql`DELETE FROM products WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};
