import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { BarChart3 } from 'lucide-react';
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
import Dashboard from './components/Dashboard';

import { 
  getSellers, 
  createSeller, 
  updateSeller,
  deleteSeller, 
  updateSellersSortOrder 
} from './services/sellerService';
import { 
  getProducts, 
  createProduct, 
  updateProduct,
  deleteProduct 
} from './services/productService';
import { saveDailyReport, getTodayReport, getLatestPreviousReports } from './services/reportService';
import { generateReportText } from './utils/generateReport';
import { copyToClipboard } from './utils/clipboard';

const APP_VERSION = 'v1.5.0';

export default function App() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [isAddSellerOpen, setIsAddSellerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🟢 ดึงข้อมูลสดจาก Neon DB เท่านั้น (ไม่ผ่าน localStorage แล้ว)
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sellerData, productData, todayReportData, prevReportData] = await Promise.all([
        getSellers(),
        getProducts(),
        getTodayReport(),
        getLatestPreviousReports()
      ]);

      const sortedSellers = (sellerData || []).sort(
        (a, b) => (a.sort_order || a.id) - (b.sort_order || b.id)
      );
      setSellers(sortedSellers);
      
      const todayReportMap = {};
      (todayReportData || []).forEach((item) => {
        todayReportMap[String(item.product_id)] = item;
      });

      const prevReportMap = {};
      (prevReportData || []).forEach((item) => {
        prevReportMap[String(item.product_id)] = item.prev_remain;
      });

      const formattedProducts = (productData || []).map((p) => {
        const pIdStr = String(p.id);
        const todayDbItem = todayReportMap[pIdStr];

        return {
          ...p,
          sent: todayDbItem ? todayDbItem.sent : '',
          sold: todayDbItem ? todayDbItem.sold : '',
          remain: todayDbItem ? todayDbItem.remain : '',
          prev_remain: prevReportMap[pIdStr] !== undefined ? prevReportMap[pIdStr] : null
        };
      });

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

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const previousSellers = [...sellers];
    const reorderedSellers = Array.from(sellers);
    const [movedSeller] = reorderedSellers.splice(result.source.index, 1);
    reorderedSellers.splice(result.destination.index, 0, movedSeller);

    const updatedSellersWithOrder = reorderedSellers.map((seller, index) => ({
      ...seller,
      sort_order: index + 1
    }));

    setSellers(updatedSellersWithOrder);

    try {
      await updateSellersSortOrder(updatedSellersWithOrder);
    } catch (err) {
      console.error('Failed to save sort order:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกลำดับลง Database');
      setSellers(previousSellers);
    }
  };

  const handleProductChange = (productId, updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (String(p.id) === String(productId) ? updatedProduct : p))
    );
  };

  const handleAddSeller = async (name) => {
    try {
      const newSeller = await createSeller(name, sellers.length + 1);
      setSellers((prev) => [...prev, newSeller]);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเพิ่มผู้ฝากขาย');
    }
  };

  const handleUpdateSeller = async (id, name) => {
    try {
      const updated = await updateSeller(id, name);
      if (updated) {
        setSellers((prev) =>
          prev.map((s) => (String(s.id) === String(id) ? { ...s, name: updated.name } : s))
        );
      }
    } catch (err) {
      console.error('handleUpdateSeller error:', err);
      throw err;
    }
  };

  const handleAddProduct = async (sellerId, name, unit) => {
    try {
      const sellerProducts = products.filter((p) => String(p.seller_id) === String(sellerId));
      const newProduct = await createProduct(sellerId, name, unit, sellerProducts.length + 1);
      setProducts((prev) => [...prev, { ...newProduct, sent: '', sold: '', remain: '' }]);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    }
  };

  const handleUpdateProduct = async (id, name, unit) => {
    try {
      const updated = await updateProduct(id, name, unit);
      if (updated) {
        setProducts((prev) =>
          prev.map((p) =>
            String(p.id) === String(id)
              ? { ...p, name: updated.name, unit: updated.unit }
              : p
          )
        );
      }
    } catch (err) {
      console.error('handleUpdateProduct error:', err);
      throw err;
    }
  };

  const handleDeleteProductDirectly = async (productId) => {
    const previousProducts = [...products];
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));

    try {
      await deleteProduct(productId);
    } catch (err) {
      console.error('Delete product error:', err);
      alert(err.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
      setProducts(previousProducts);
    }
  };

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
      alert(err.message || 'เกิดข้อผิดพลาดในการลบข้อมูลผู้ฝากขาย');
    } finally {
      setDeleteTarget(null);
    }
  };

  // 🟢 1. บันทึกข้อมูลลง DB อย่างเดียว
  const handleSaveOnly = async () => {
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
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save report:', err);
      alert(`เกิดข้อผิดพลาดในการบันทึกรายงาน: ${err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Database'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟢 2. บันทึกข้อมูลลง DB + คัดลอกรายงาน
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
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-gray-50 pb-28 font-sans text-gray-900 flex flex-col justify-between">
            <div>
              <Header 
                onOpenAddSeller={() => setIsAddSellerOpen(true)}
                isDebugOpen={isDebugOpen}
                onToggleDebug={() => setIsDebugOpen(!isDebugOpen)}
                onOpenHistory={() => setIsHistoryOpen(true)}
              />

              <div className="max-w-md mx-auto px-4 pt-3 flex justify-end">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all"
                >
                  <BarChart3 size={15} />
                  <span>ดู Dashboard Real-time</span>
                </button>
              </div>

              <main className="max-w-md mx-auto p-4">
                {isDebugOpen && <DbHealthCheck />}

                {loading ? (
                  <Loading />
                ) : sellers.length === 0 ? (
                  <EmptyState onAddSeller={() => setIsAddSellerOpen(true)} />
                ) : (
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
                                      onUpdateSeller={handleUpdateSeller}
                                      onUpdateProduct={handleUpdateProduct}
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
            </div>

            <footer className="text-center py-4 text-xs text-gray-400 font-mono select-none">
              PX Daily Report System {APP_VERSION}
            </footer>

            {sellers.length > 0 && (
              <BottomBar
                onSave={handleSaveOnly}
                onGenerate={handleGenerateReport}
                isSaved={isSaved}
                isCopied={isCopied}
                isSubmitting={isSubmitting}
              />
            )}

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
              message="การลบผู้ฝากขายจะลบได้เฉพาะผู้ฝากขายที่ยังไม่มีประวัติในรายงานย้อนหลังเท่านั้น คุณต้องการลบใช่หรือไม่?"
              onConfirm={handleConfirmDeleteSeller}
              onCancel={() => setDeleteTarget(null)}
            />

            <InstallPWA />
          </div>
        }
      />

      <Route
        path="/dashboard"
        element={<Dashboard onBack={() => navigate('/')} />}
      />
    </Routes>
  );
}
