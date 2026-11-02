import React, { useState } from 'react';
import { User, Product, Category, Order, OrderStatus, InventoryMovement } from '../types';
import { storeService } from '../services/storeService';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  Users,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Download,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  onStaffLogin: (email: string) => void;
  onReturnToStore: () => void;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onStaffLogin,
  onReturnToStore,
  onRefreshData,
}) => {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'products' | 'categories' | 'inventory' | 'customers' | 'orders' | 'payments' | 'analytics'
  >('overview');

  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Search & filter states
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals inside Admin
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState<Product | null>(null);
  const [stockChangeAmount, setStockChangeAmount] = useState<number>(5);
  const [stockChangeReason, setStockChangeReason] = useState<InventoryMovement['reason']>('Admin Restock');

  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; isError: boolean } | null>(null);

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!staffEmail.trim()) {
      setLoginError('Please enter your staff email.');
      return;
    }
    // Accept staff admin email
    if (staffEmail.trim().toLowerCase() === 'admin@amocart.com') {
      onStaffLogin('admin@amocart.com');
    } else {
      setLoginError('Access denied: Email does not have merchant staff credentials.');
    }
  };

  // If unauthorized, show merchant staff login gateway
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">AmoCart Merchant Back-Office</h2>
            <p className="mt-1 text-xs text-slate-500">
              Restricted staff portal for inventory, catalog, and order fulfillment.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {loginError}
            </div>
          )}

          <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Merchant Staff Email</label>
              <input
                type="email"
                required
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Access Key / Password</label>
              <input
                type="password"
                required
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
            >
              Authenticate Staff Access
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Staff Account: admin@amocart.com</span>
            <button
              onClick={onReturnToStore}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Return to Store →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Load real database data
  const summary = storeService.getAnalyticsSummary();
  const products = storeService.getProducts({ activeOnly: false });
  const categories = storeService.getCategories();
  const orders = storeService.getOrders();
  const payments = storeService.getPayments();
  const customers = storeService.getUsers().filter((u) => u.role === 'customer');
  const inventoryLogs = storeService.getInventoryLogs();

  // Notification helper
  const showNotice = (message: string, isError = false) => {
    setFeedbackNotice({ message, isError });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // CSV Report Export
  const handleDownloadCsv = () => {
    const csvContent = storeService.generateOrdersCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `amocart_orders_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Orders database report exported to CSV successfully.');
  };

  // Product Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) {
      showNotice('Product name and valid price are required.', true);
      return;
    }

    const res = storeService.saveProduct(editingProduct);
    if (res.success) {
      showNotice(editingProduct.id ? 'Product updated successfully.' : 'New product created.');
      setIsProductModalOpen(false);
      setEditingProduct(null);
      onRefreshData();
    } else {
      showNotice(res.error || 'Failed to save product.', true);
    }
  };

  // Product Delete
  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const res = storeService.deleteProduct(productId);
      if (res.success) {
        showNotice('Product removed from catalog.');
        onRefreshData();
      }
    }
  };

  // Stock Adjustment
  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustmentProduct) return;

    const res = storeService.adjustStock(
      stockAdjustmentProduct.id,
      stockChangeAmount,
      stockChangeReason,
      currentUser.email
    );

    if (res.success) {
      showNotice(`Stock updated for ${stockAdjustmentProduct.name}.`);
      setIsStockModalOpen(false);
      setStockAdjustmentProduct(null);
      onRefreshData();
    } else {
      showNotice(res.error || 'Failed to update stock.', true);
    }
  };

  // Order Status Update
  const handleOrderStatusChange = (orderId: string, newStatus: OrderStatus) => {
    let trackingNumber: string | undefined;
    if (newStatus === 'Shipped') {
      trackingNumber = prompt('Enter Courier Tracking / AWB Number (e.g. BLRDEL-982341-IN):', `EXP-${Date.now().toString().slice(-6)}-IN`) || undefined;
    }

    const res = storeService.updateOrderStatus(orderId, newStatus, currentUser.email, trackingNumber);
    if (res.success) {
      showNotice(`Order status changed to "${newStatus}".`);
      onRefreshData();
    }
  };

  // Process Refund
  const handleProcessRefund = (orderId: string) => {
    if (confirm('Process full refund via Razorpay API and update payment status?')) {
      const res = storeService.processRazorpayRefund(orderId, currentUser.email);
      if (res.success) {
        showNotice('Full refund processed via Razorpay API.');
        onRefreshData();
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Banner Notice */}
      {feedbackNotice && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedbackNotice.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {feedbackNotice.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{feedbackNotice.message}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded uppercase tracking-wider">
              Merchant Operations
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">AmoCart Store Administration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Store Management Suite
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time management for catalog items, stock movements, and customer order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onReturnToStore}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            ← Storefront
          </button>
          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct({
                name: '',
                description: '',
                price: 2999,
                originalPrice: 3499,
                categoryId: categories[0]?.id || 'cat-audio',
                stock: 15,
                lowStockThreshold: 4,
                isActive: true,
                images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
              });
              setIsProductModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-[#2874F0] hover:bg-blue-600 rounded-xs transition-colors flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3">
          <div className="bg-[#172337] rounded-xs border border-slate-700 p-3 shadow-md space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
              { id: 'products', label: 'Products Catalog', icon: Package, count: summary.totalProducts },
              { id: 'inventory', label: 'Inventory & Audits', icon: Boxes, count: summary.lowStockProducts, badgeColor: 'text-amber-300 bg-amber-950/80' },
              { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingCart, count: summary.totalOrders },
              { id: 'customers', label: 'Customer Accounts', icon: Users, count: summary.registeredCustomers },
              { id: 'payments', label: 'Razorpay Payments', icon: CreditCard },
              { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#2874F0] text-white shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-9 space-y-6">
          {/* SECTION: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">Gross Sales</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                    ₹{summary.grossSales.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">{summary.paidOrdersCount} verified orders</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">Net Revenue</p>
                  <p className="text-xl font-extrabold text-indigo-600 font-mono mt-1">
                    ₹{summary.netRevenue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">After ₹{summary.refundTotal.toLocaleString()} refunds</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">Average Order Value</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                    ₹{summary.averageOrderValue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Across all paid baskets</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">Inventory Status</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                    {summary.lowStockProducts} Low / {summary.outOfStockProducts} Out
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1 font-medium">Attention required</p>
                </div>
              </div>

              {/* Quick Table: Recent Orders */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Recent Customer Purchases</h3>
                  <button
                    onClick={() => setActiveSection('orders')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    View All ({orders.length}) →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-medium">
                        <th className="pb-2.5">Order No</th>
                        <th className="pb-2.5">Customer</th>
                        <th className="pb-2.5">Amount</th>
                        <th className="pb-2.5">Payment</th>
                        <th className="pb-2.5">Order Status</th>
                        <th className="pb-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {orders.slice(0, 5).map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                          <td className="py-3 text-slate-700">{ord.customerName}</td>
                          <td className="py-3 font-mono">₹{ord.finalAmount.toLocaleString('en-IN')}</td>
                          <td className="py-3">
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => { setActiveSection('orders'); setOrderSearch(ord.orderNumber); }}
                              className="text-indigo-600 hover:underline font-semibold"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PRODUCTS */}
          {activeSection === 'products' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product title, SKU..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Showing {products.length} products across 5 active categories
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-medium">
                      <th className="pb-2.5">Product</th>
                      <th className="pb-2.5">Category</th>
                      <th className="pb-2.5">Price</th>
                      <th className="pb-2.5">Stock</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products
                      .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 max-w-xs truncate">{p.name}</p>
                              <p className="text-[11px] font-mono text-slate-400">{p.sku}</p>
                            </div>
                          </td>
                          <td className="py-3 text-slate-600">{p.categoryName}</td>
                          <td className="py-3 font-mono font-bold text-slate-900">₹{p.price.toLocaleString('en-IN')}</td>
                          <td className="py-3">
                            <span className={`font-mono font-bold ${
                              p.stock === 0 ? 'text-rose-600' : p.stock <= p.lowStockThreshold ? 'text-amber-600' : 'text-slate-800'
                            }`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {p.isActive ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct({ ...p });
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: INVENTORY */}
          {activeSection === 'inventory' && (
            <div className="space-y-6">
              {/* Product Stock Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Current Stock Levels & Adjustment</h3>
                  <span className="text-xs text-slate-500">Atomic inventory decrements prevent overselling</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-medium">
                        <th className="pb-2.5">Product SKU</th>
                        <th className="pb-2.5">Product Name</th>
                        <th className="pb-2.5">Available Stock</th>
                        <th className="pb-2.5">Stock Status</th>
                        <th className="pb-2.5 text-right">Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => {
                        const status = p.stock === 0 ? 'Out of Stock' : p.stock <= p.lowStockThreshold ? 'Low Stock' : 'In Stock';
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-3 font-mono text-slate-500">{p.sku}</td>
                            <td className="py-3 font-semibold text-slate-900">{p.name}</td>
                            <td className="py-3 font-mono font-bold text-slate-900">{p.stock} units</td>
                            <td className="py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                status === 'In Stock'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : status === 'Low Stock'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  setStockAdjustmentProduct(p);
                                  setStockChangeAmount(10);
                                  setIsStockModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                              >
                                Adjust Stock
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Movement History Audit Log */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Inventory Movement Audit Trail</h3>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {inventoryLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{log.productName}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-slate-500">{log.sku}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          By {log.administrator} · Reason: <strong>{log.reason}</strong> · {new Date(log.timestamp).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold ${log.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                        </span>
                        <p className="text-[10px] text-slate-400">Balance: {log.balanceAfter}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: ORDERS */}
          {activeSection === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by order number or customer..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All Order Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-medium">
                      <th className="pb-2.5">Order No</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Customer</th>
                      <th className="pb-2.5">Amount</th>
                      <th className="pb-2.5">Order Status</th>
                      <th className="pb-2.5">Tracking / AWB</th>
                      <th className="pb-2.5 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders
                      .filter((o) => {
                        const matchQuery = o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) || o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase());
                        const matchStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
                        return matchQuery && matchStatus;
                      })
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                          <td className="py-3 text-slate-500">{o.createdAt.split('T')[0]}</td>
                          <td className="py-3">
                            <p className="font-semibold text-slate-800">{o.customerName}</p>
                            <p className="text-[11px] text-slate-400">{o.customerEmail}</p>
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-900">₹{o.finalAmount.toLocaleString('en-IN')}</td>
                          <td className="py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              o.orderStatus === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700'
                                : o.orderStatus === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-[11px] text-slate-600">
                            {o.trackingNumber || 'Unassigned'}
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <select
                                value={o.orderStatus}
                                onChange={(e) => handleOrderStatusChange(o.id, e.target.value as OrderStatus)}
                                className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                              >
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Packed">Packed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              {o.paymentStatus === 'Captured' && o.orderStatus !== 'Refunded' && (
                                <button
                                  onClick={() => handleProcessRefund(o.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                  title="Process Razorpay Refund"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: CUSTOMERS */}
          {activeSection === 'customers' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Registered Customer Accounts</h3>
                <span className="text-xs text-slate-500">Security compliant: Passwords and tokens never exposed</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-medium">
                      <th className="pb-2.5">Customer</th>
                      <th className="pb-2.5">Registered Date</th>
                      <th className="pb-2.5">Orders Placed</th>
                      <th className="pb-2.5">Total Spent</th>
                      <th className="pb-2.5">Account Status</th>
                      <th className="pb-2.5 text-right">Toggle Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => {
                      const userOrders = orders.filter((o) => o.customerId === c.id);
                      const totalSpent = userOrders.reduce((sum, o) => sum + o.finalAmount, 0);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3">
                            <p className="font-semibold text-slate-900">{c.fullName}</p>
                            <p className="text-[11px] text-slate-500">{c.email}</p>
                          </td>
                          <td className="py-3 text-slate-500">{c.createdAt.split('T')[0]}</td>
                          <td className="py-3 font-mono font-bold text-slate-800">{userOrders.length}</td>
                          <td className="py-3 font-mono font-bold text-indigo-600">₹{totalSpent.toLocaleString('en-IN')}</td>
                          <td className="py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {c.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                storeService.toggleUserStatus(c.id);
                                showNotice(`Account status updated for ${c.email}`);
                                onRefreshData();
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                              {c.isActive ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: PAYMENTS */}
          {activeSection === 'payments' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Razorpay Payment Settlements Log</h3>
                  <p className="text-xs text-slate-500">Cryptographically verified server-side transaction receipts.</p>
                </div>
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded">
                  Gateway: Razorpay Checkout v1
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-medium">
                      <th className="pb-2.5">Order No</th>
                      <th className="pb-2.5">Razorpay Order ID</th>
                      <th className="pb-2.5">Razorpay Payment ID</th>
                      <th className="pb-2.5">Amount</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{p.orderNumber}</td>
                        <td className="py-3 text-slate-500 text-[11px]">{p.gatewayOrderId}</td>
                        <td className="py-3 text-indigo-600 font-semibold text-[11px]">{p.gatewayPaymentId}</td>
                        <td className="py-3 font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-emerald-600 text-[11px]">
                          HMAC-SHA256 Match
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: ANALYTICS */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              {/* Category Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue Breakdown by Product Category</h3>
                <div className="space-y-3">
                  {summary.categorySales.map((cat) => {
                    const pct = summary.grossSales > 0 ? Math.round((cat.amount / summary.grossSales) * 100) : 0;
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800">{cat.name}</span>
                          <span className="font-mono text-slate-600">₹{cat.amount.toLocaleString('en-IN')} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Top-Selling Products by Units</h3>
                <div className="divide-y divide-slate-100">
                  {summary.topSellingProducts.map((item, idx) => (
                    <div key={item.product.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-slate-400 font-bold font-mono">0{idx + 1}</span>
                        <div>
                          <p className="font-semibold text-slate-900">{item.product.name}</p>
                          <p className="text-[11px] text-slate-500">{item.product.categoryName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-900">{item.unitsSold} units sold</p>
                        <p className="text-[11px] font-mono text-indigo-600">₹{item.totalRevenue.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingProduct.id ? 'Edit Product Details' : 'Add New Catalog Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Ergonomic Walnut Wrist Rest"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Low-Stock Alert</label>
                  <input
                    type="number"
                    value={editingProduct.lowStockThreshold || 5}
                    onChange={(e) => setEditingProduct({ ...editingProduct, lowStockThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Materials, specs, dimensions, warranty..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingProduct.images?.[0] || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT */}
      {isStockModalOpen && stockAdjustmentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Adjust Inventory Stock
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {stockAdjustmentProduct.name} · Current Stock: <strong className="font-mono text-indigo-600">{stockAdjustmentProduct.stock} units</strong>
            </p>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity Change (+ to add, - to reduce)</label>
                <input
                  type="number"
                  required
                  value={stockChangeAmount}
                  onChange={(e) => setStockChangeAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Resulting balance after adjustment: <strong>{stockAdjustmentProduct.stock + stockChangeAmount}</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Reason (Audit Log)</label>
                <select
                  value={stockChangeReason}
                  onChange={(e) => setStockChangeReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Admin Restock">Admin Restock (Supplier delivery)</option>
                  <option value="Damage / Loss">Damage / Loss (Damaged in warehouse)</option>
                  <option value="Cycle Count Correction">Cycle Count Correction (Physical count audit)</option>
                  <option value="Order Cancellation">Order Cancellation (Returned to stock)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 font-semibold rounded-lg shadow-sm"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
