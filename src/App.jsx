import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { RefreshCw } from 'lucide-react';
import Header from './components/Header';
import SellerAccordion from './components/SellerAccordion';
import BottomBar from './components/BottomBar';
import AddSellerSheet from './components/AddSellerSheet';
import AddProductSheet from './components/AddProductSheet';
import EditProductSheet from './components/EditProductSheet';
import ShareSellerModal from './components/ShareSellerModal';
import ConfirmDialog from './components/ConfirmDialog';
import AlertModal from './components/AlertModal';
import EmptyState from './components/EmptyState';
import Loading from './components/Loading';
import DbHealthCheck from './components/DbHealthCheck';
import HistorySheet from './components/HistorySheet';
import InstallPWA from './components/InstallPWA';
import Dashboard from './components/Dashboard';
import SellerShareView from './components/SellerShareView';

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
import Footer from './components/Footer';
import AdminGuard from './components/AdminGuard';
import StatusStateView from './components/StatusStateView';

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
  const [editingProduct, setEditingProduct] = useState(null);
  const [sharingSeller, setSharingSeller] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alertInfo, setAlertInfo] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: ''
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔄 Pull to Refresh States & Logic
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isDraggingPage = useRef(false);

  const PULL_THRESHOLD = 20; // ระยะลาก (px) ที่จะทริกเกอร์โหลดข้อมูล

  // 🟢 ดึงข้อมูลสดจาก Neon DB
  const fetchData = async (isPull = false) => {
    try {
      if (!isPull) setLoading(true);
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
          sent: todayDbItem ? (todayDbItem.sent ?? '') : '',
          sold: todayDbItem ? (todayDbItem.sold ?? '') : '',
          remain: todayDbItem ? (todayDbItem.remain ?? '') : '',
          prev_remain: prevReportMap[pIdStr] !== undefined ? prevReportMap[pIdStr] : null,
          
          // 🎁 คืนค่าสถานะโปรโมชั่น 1 แถม 1 และโหมดคำนวณที่บันทึกไว้
          is_promo: todayDbItem ? Boolean(todayDbItem.is_promo) : false,
          free_qty: todayDbItem ? (Number(todayDbItem.free_qty) || 0) : 0,
          original_sent: todayDbItem && todayDbItem.original_sent !== null && todayDbItem.original_sent !== undefined
            ? Number(todayDbItem.original_sent)
            : null,
          calc_mode: todayDbItem ? (todayDbItem.calc_mode || 'AUTO_REMAIN') : 'AUTO_REMAIN',
          promo_remainder: todayDbItem ? (Number(todayDbItem.promo_remainder) || 0) : 0,
          price_snapshot: todayDbItem ? (todayDbItem.price_snapshot ?? p.price) : (p.price ?? 0),
        };
      });

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error loading data from database:', err);
    } finally {
      if (!isPull) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔄 จัดการ Touch Event สำหรับ Pull-to-Refresh
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY <= 0) {
        touchStartY.current = e.touches[0].clientY;
        isDraggingPage.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isDraggingPage.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;

      if (distance > 0 && window.scrollY <= 0) {
        const dampedDistance = Math.min(distance * 0.45, 50);
        setPullDistance(dampedDistance);
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDraggingPage.current) return;
      isDraggingPage.current = false;

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(50);

        try {
          await fetchData(true);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing]);

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
      console.error(err);
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

  const handleAddProduct = async (sellerId, name, unit, price = 0) => {
    try {
      const sellerProducts = products.filter((p) => String(p.seller_id) === String(sellerId));
      const sortOrder = sellerProducts.length + 1;

      const newProduct = await createProduct(sellerId, name, unit, price, sortOrder);

      setProducts((prev) => [
        ...prev,
        {
          ...newProduct,
          sent: '',
          sold: '',
          remain: '',
          price: Number(price) || 0,
          is_promo: false,
          free_qty: 0,
          original_sent: null,
          calc_mode: 'AUTO_REMAIN',
          promo_remainder: 0,
          price_snapshot: Number(price) || 0
        }
      ]);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    }
  };

  const handleUpdateProduct = async (id, name, unit, price = 0) => {
    try {
      const updated = await updateProduct(id, name, unit, price);
      if (updated) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: updated.name,
                  unit: updated.unit,
                  price: Number(price) || 0,
                  price_snapshot: Number(price) || 0
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error('handleUpdateProduct error:', err);
      alert('เกิดข้อผิดพลาดในการแก้ไขสินค้า');
      throw err;
    }
  };

  const handleDeleteProductDirectly = async (productId) => {
    const previousProducts = [...products];
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));

    try {
      await deleteProduct(productId);
      return true;
    } catch (err) {
      console.error('Delete product error:', err);
      setProducts(previousProducts);
      setAlertInfo({
        isOpen: true,
        type: 'error',
        title: 'ไม่สามารถลบสินค้าได้',
        message: err.message || 'เกิดข้อผิดพลาดในการลบสินค้า'
      });
      return false;
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
      setAlertInfo({
        isOpen: true,
        type: 'error',
        title: 'ไม่สามารถลบผู้ฝากขายได้',
        message: err.message || 'เกิดข้อผิดพลาดในการลบข้อมูลผู้ฝากขาย'
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  // 🛠️ Helper แปลงข้อมูลสินค้าเป็น Payload พร้อม Snapshots ครบถ้วน
  const prepareReportPayload = (productsList, sellersList) => {
    return productsList.map((p) => {
      const seller = (sellersList || []).find((s) => String(s.id) === String(p.seller_id));
      const sellerName = p.seller_name || (seller ? seller.name : null);
      const isPromo = Boolean(p.is_promo);

      return {
        seller_id: Number(p.seller_id),
        product_id: Number(p.id),

        // 📸 Snapshots
        seller_name_snapshot: sellerName ? String(sellerName).trim() : null,
        product_name_snapshot: p.name ? String(p.name).trim() : null,
        unit_snapshot: p.unit ? String(p.unit).trim() : 'ชิ้น',
        price_snapshot: Number(p.price_snapshot ?? p.price ?? 0),

        // 🔢 ยอดหลักคำนวณเงิน (ยอดสุทธิ)
        sent: Number(p.sent) || 0,
        sold: Number(p.sold) || 0,
        remain: Number(p.remain) || 0,

        // 🎁 ข้อมูลโปรโมชั่น 1 แถม 1 & สถานะโหมดคำนวณ
        is_promo: isPromo,
        free_qty: isPromo ? (Number(p.free_qty) || 0) : 0,
        original_sent: isPromo ? (Number(p.original_sent) || Number(p.sent)) : null,
        calc_mode: p.calc_mode || 'AUTO_REMAIN',
        promo_remainder: isPromo ? (Number(p.promo_remainder) || 0) : 0,
      };
    });
  };

  // 🟢 1. บันทึกข้อมูลลง DB อย่างเดียว
  const handleSaveOnly = async () => {
    if (sellers.length === 0) {
      alert('ยังไม่มีข้อมูลผู้ฝากขาย');
      return;
    }

    try {
      setIsSubmitting(true);
      const reportItems = prepareReportPayload(products, sellers);
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
      const reportItems = prepareReportPayload(products, sellers);
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

  const handleShowAlert = (title, message) => {
    setAlertInfo({
      isOpen: true,
      type: 'error',
      title: title || 'แจ้งเตือน',
      message: message || ''
    });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AdminGuard>
            <div className="min-h-screen bg-gray-50 pb-28 font-sans text-gray-900 flex flex-col justify-between">
              <div>
                <Header
                  onOpenAddSeller={() => setIsAddSellerOpen(true)}
                  isDebugOpen={isDebugOpen}
                  onToggleDebug={() => setIsDebugOpen(!isDebugOpen)}
                  onOpenHistory={() => setIsHistoryOpen(true)}
                  onOpenDashboard={() => navigate('/dashboard')}
                />

                <main className="max-w-2xl mx-auto p-4 pb-0 relative">
                  {/* 🌟 Pull to Refresh Spinner Indicator */}
                  <div
                    className="fixed top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center justify-center transition-all duration-150 ease-out"
                    style={{
                      transform: `translate(-20%, ${pullDistance > 0 || isRefreshing ? pullDistance : -20}px)`,
                      opacity: pullDistance > 10 || isRefreshing ? 1 : 0
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-amber-300 shadow-xl shadow-amber-900/10 flex items-center justify-center text-amber-600">
                      <RefreshCw
                        size={18}
                        className={`${isRefreshing ? 'animate-spin' : ''}`}
                        style={{
                          transform: isRefreshing ? 'none' : `rotate(${pullDistance * 4.5}deg)`
                        }}
                      />
                    </div>
                  </div>

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
                                        onEditProduct={(prod) => setEditingProduct(prod)}
                                        onShareSeller={(s) => setSharingSeller(s)}
                                        onShowAlert={handleShowAlert}
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

              <Footer />

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

              <EditProductSheet
                isOpen={!!editingProduct}
                product={editingProduct}
                onClose={() => setEditingProduct(null)}
                onSave={handleUpdateProduct}
              />

              <ShareSellerModal
                isOpen={!!sharingSeller}
                seller={sharingSeller}
                onClose={() => setSharingSeller(null)}
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

              <AlertModal
                isOpen={alertInfo.isOpen}
                type={alertInfo.type}
                title={alertInfo.title}
                message={alertInfo.message}
                onClose={() => setAlertInfo((prev) => ({ ...prev, isOpen: false }))}
              />

              <InstallPWA />
            </div>
          </AdminGuard>
        }
      />

      <Route
        path="/dashboard"
        element={
          <AdminGuard>
            <Dashboard onBack={() => navigate('/')} />
          </AdminGuard>
        }
      />

      <Route 
        path="*"
        element={<StatusStateView />}
      />

      <Route
        path="/share/:sellerId"
        element={<SellerShareView />}
      />
    </Routes>
  );
}