import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Header from './components/Header';
import SellerAccordion from './components/SellerAccordion';
import BottomBar from './components/BottomBar';
import AddSellerSheet from './components/AddSellerSheet';
import AddProductSheet from './components/AddProductSheet';
import ConfirmDialog from './components/ConfirmDialog';
import EmptyState from './components/EmptyState';
import Loading from './components/Loading';
import DbHealthCheck from './components/DbHealthCheck';
import HistorySheet from './components/HistorySheet';
import InstallPWA from './components/InstallPWA';

import { 
  getSellers, 
  createSeller, 
  deleteSeller, 
  updateSellersSortOrder 
} from './services/sellerService';
import { getProducts, createProduct, deleteProduct } from './services/productService';
import { saveDailyReport } from './services/reportService';
import { generateReportText } from './utils/generateReport';
import { copyToClipboard } from './utils/clipboard';

export default function App() {
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debug & History Sheet Control States
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Sheets & Modals Control
  const [isAddSellerOpen, setIsAddSellerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(null);

  // Delete Target Modal (เฉพาะลบ Seller)
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Statuses
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Initial Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sellerData, productData] = await Promise.all([
        getSellers(),
        getProducts()
      ]);

      // เรียงลำดับตาม sort_order ก่อนเข้า State
      const sortedSellers = (sellerData || []).sort(
        (a, b) => (a.sort_order || a.id) - (b.sort_order || b.id)
      );
      setSellers(sortedSellers);
      
      const formattedProducts = (productData || []).map((p) => ({
        ...p,
        sent: '',
        sold: '',
        remain: ''
      }));
      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error loading data from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🟢 ลากสลับลำดับผู้ฝากขาย + อัปเดต sort_order ลง Database
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const previousSellers = [...sellers];

    // 1. สลับตำแหน่งใน State ก่อนเพื่อให้ UI ตอบสนองทันที
    const reorderedSellers = Array.from(sellers);
    const [movedSeller] = reorderedSellers.splice(result.source.index, 1);
    reorderedSellers.splice(result.destination.index, 0, movedSeller);

    // 2. รันลำดับ sort_order ใหม่ (1, 2, 3...)
    const updatedSellersWithOrder = reorderedSellers.map((seller, index) => ({
      ...seller,
      sort_order: index + 1
    }));

    setSellers(updatedSellersWithOrder);

    // 3. บันทึกลำดับใหม่ลง Database
    try {
      await updateSellersSortOrder(updatedSellersWithOrder);
    } catch (err) {
      console.error('Failed to save sort order:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกลำดับลง Database');
      // คืนค่า State เดิมหากมีปัญหา
      setSellers(previousSellers);
    }
  };

  // Update Product Inputs
  const handleProductChange = (productId, updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (String(p.id) === String(productId) ? updatedProduct : p))
    );
  };

  // Add Seller
  const handleAddSeller = async (name) => {
    try {
      const newSeller = await createSeller(name, sellers.length + 1);
      setSellers((prev) => [...prev, newSeller]);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเพิ่มผู้ฝากขาย');
    }
  };

  // Add Product
  const handleAddProduct = async (sellerId, name, unit) => {
    try {
      const sellerProducts = products.filter((p) => String(p.seller_id) === String(sellerId));
      const newProduct = await createProduct(sellerId, name, unit, sellerProducts.length + 1);
      setProducts((prev) => [...prev, { ...newProduct, sent: '', sold: '', remain: '' }]);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    }
  };

  // ลบสินค้าโดยตรงทันที
  const handleDeleteProductDirectly = async (productId) => {
    const previousProducts = [...products];
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));

    try {
      await deleteProduct(productId);
    } catch (err) {
      console.error('Delete product error:', err);
      alert('เกิดข้อผิดพลาดในการลบสินค้า');
      setProducts(previousProducts);
    }
  };

  // ยืนยันลบผู้ฝากขาย
  const handleConfirmDeleteSeller = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'seller') {
        await deleteSeller(deleteTarget.id);
        setSellers((prev) => prev.filter((s) => String(s.id) !== String(deleteTarget.id)));
        setProducts((prev) => prev.filter((p) => String(p.seller_id) !== String(deleteTarget.id)));
      }
    } catch (err) {
      console.error('Delete seller error:', err);
      alert('เกิดข้อผิดพลาดในการลบข้อมูลผู้ฝากขาย');
    } finally {
      setDeleteTarget(null);
    }
  };

  // บันทึกรายงาน และ คัดลอก
  const handleGenerateReport = async () => {
    if (sellers.length === 0) {
      alert('ยังไม่มีข้อมูลผู้ฝากขาย');
      return;
    }

    try {
      setIsSubmitting(true);

      const reportItems = products.map((p) => ({
        seller_id: p.seller_id,
        product_id: p.id,
        sent: p.sent,
        sold: p.sold,
        remain: p.remain
      }));

      await saveDailyReport(reportItems);

      const reportText = generateReportText(sellers, products);

      const success = await copyToClipboard(reportText);
      if (success) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        alert('บันทึกข้อมูลเรียบร้อยแล้ว (ไม่สามารถคัดลอกข้อความอัตโนมัติได้)');
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert(`เกิดข้อผิดพลาดในการบันทึกรายงาน: ${err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Database'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <Header 
        onOpenAddSeller={() => setIsAddSellerOpen(true)}
        isDebugOpen={isDebugOpen}
        onToggleDebug={() => setIsDebugOpen(!isDebugOpen)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <main className="max-w-md mx-auto p-4">
        {isDebugOpen && <DbHealthCheck />}

        {loading ? (
          <Loading />
        ) : sellers.length === 0 ? (
          <EmptyState onAddSeller={() => setIsAddSellerOpen(true)} />
        ) : (
          /* 🟢 Drag and Drop Context จัดเรียงลำดับ */
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sellers-list">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {sellers.map((seller, index) => {
                    const sellerProducts = products.filter(
                      (p) => String(p.seller_id) === String(seller.id)
                    );

                    return (
                      <Draggable key={String(seller.id)} draggableId={String(seller.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`transition-shadow ${snapshot.isDragging ? 'shadow-lg rounded-2xl z-50 opacity-90' : ''}`}
                          >
                            <SellerAccordion
                              seller={seller}
                              products={sellerProducts}
                              onProductChange={handleProductChange}
                              onDeleteProduct={handleDeleteProductDirectly}
                              onDeleteSeller={(id) => setDeleteTarget({ type: 'seller', id })}
                              onOpenAddProduct={(sellerId) => {
                                setSelectedSellerId(sellerId);
                                setIsAddProductOpen(true);
                              }}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </main>

      {sellers.length > 0 && (
        <BottomBar
          onGenerate={handleGenerateReport}
          isCopied={isCopied}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Sheets & Modals */}
      <AddSellerSheet
        isOpen={isAddSellerOpen}
        onClose={() => setIsAddSellerOpen(false)}
        onAdd={handleAddSeller}
      />

      <AddProductSheet
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAdd={handleAddProduct}
        sellerId={selectedSellerId}
      />

      <HistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget && deleteTarget.type === 'seller'}
        title="ยืนยันการลบผู้ฝากขาย"
        message="การลบผู้ฝากขายจะทำการลบสินค้าทั้งหมดของผู้ฝากคนนี้ด้วย คุณต้องการลบใช่หรือไม่?"
        onConfirm={handleConfirmDeleteSeller}
        onCancel={() => setDeleteTarget(null)}
      />
      <InstallPWA />
    </div>
  );
}
