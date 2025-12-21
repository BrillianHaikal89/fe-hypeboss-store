// app/modules/carts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
  AlertCircle,
  Package,
  CheckCircle,
  ChevronRight,
  Home,
  Store,
  X,
  Loader2,
  Info
} from "lucide-react";
import { useAuthStore } from "../../store/auth-store";

interface CartItem {
  cart_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  category_name: string;
  price: number;
  discount_price: number | null;
  final_price: number;
  quantity: number;
  stock: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

interface CartData {
  user_id: number;
  items: CartItem[];
  total_items: number;
  total_amount: number;
}

interface DeleteModalState {
  isOpen: boolean;
  cartId: number | null;
  productId: number | null;
  productName: string;
}

interface ClearCartModalState {
  isOpen: boolean;
}

// Interface untuk data checkout
interface CheckoutData {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  timestamp: string;
}

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, token, logout } = useAuthStore();
  
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // State untuk modal hapus
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    cartId: null,
    productId: null,
    productName: ""
  });
  
  // State untuk modal hapus semua
  const [clearCartModal, setClearCartModal] = useState<ClearCartModalState>({
    isOpen: false
  });
  
  // Helper functions for price calculations
  const getFinalPrice = (item: CartItem) => {
    if (item.discount_price && item.discount_price > 0) {
      return item.price - item.discount_price;
    }
    return item.price;
  };

  const getSubtotal = (item: CartItem) => {
    return getFinalPrice(item) * item.quantity;
  };

  const getDiscountPercentage = (item: CartItem) => {
    if (item.discount_price && item.discount_price > 0) {
      return Math.round((item.discount_price / item.price) * 100);
    }
    return 0;
  };
  
  // Check authentication
  useEffect(() => {
    setIsClient(true);
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch cart data
  const fetchCart = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch("http://localhost:3001/api/carts", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCart(data.data);
        // Select all items by default
        setSelectedItems(data.data.items.map((item: CartItem) => item.cart_id));
      } else {
        setError(data.message || "Gagal memuat keranjang");
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Terjadi kesalahan saat memuat keranjang");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isClient && token) {
      fetchCart();
    }
  }, [isClient, token]);

  // Handle quantity update
  const updateQuantity = async (cartId: number, productId: number, newQuantity: number) => {
    if (!token || newQuantity < 1) return;
    
    setIsUpdating(cartId);
    
    try {
      const response = await fetch(`http://localhost:3001/api/carts/${productId}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage("Jumlah produk berhasil diperbarui");
        fetchCart(); // Refresh cart
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(data.message || "Gagal memperbarui jumlah produk");
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Terjadi kesalahan saat memperbarui jumlah");
    } finally {
      setIsUpdating(null);
    }
  };

  // Open delete modal
  const openDeleteModal = (cartId: number, productId: number, productName: string) => {
    setDeleteModal({
      isOpen: true,
      cartId,
      productId,
      productName
    });
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      cartId: null,
      productId: null,
      productName: ""
    });
  };

  // Remove item from cart
  const removeItem = async () => {
    const { cartId, productId } = deleteModal;
    
    if (!token || !cartId || !productId) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/carts/${productId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage("Produk berhasil dihapus dari keranjang");
        fetchCart(); // Refresh cart
        // Remove from selected items
        setSelectedItems(prev => prev.filter(id => id !== cartId));
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(data.message || "Gagal menghapus produk");
      }
    } catch (err) {
      console.error("Error removing item:", err);
      setError("Terjadi kesalahan saat menghapus produk");
    } finally {
      closeDeleteModal();
    }
  };

  // Open clear cart modal
  const openClearCartModal = () => {
    setClearCartModal({ isOpen: true });
  };

  // Close clear cart modal
  const closeClearCartModal = () => {
    setClearCartModal({ isOpen: false });
  };

  // Clear all items from cart
  const clearCart = async () => {
    if (!token || !cart?.items.length) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/carts`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage("Keranjang berhasil dikosongkan");
        setCart(null);
        setSelectedItems([]);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(data.message || "Gagal mengosongkan keranjang");
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
      setError("Terjadi kesalahan saat mengosongkan keranjang");
    } finally {
      closeClearCartModal();
    }
  };

  // Handle item selection
  const toggleItemSelection = (cartId: number) => {
    setSelectedItems(prev => 
      prev.includes(cartId)
        ? prev.filter(id => id !== cartId)
        : [...prev, cartId]
    );
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (!cart?.items) return;
    
    if (selectedItems.length === cart.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.items.map(item => item.cart_id));
    }
  };

  // Calculate selected items total
  const calculateSelectedTotal = () => {
    if (!cart?.items) return { amount: 0, items: 0 };
    
    const selected = cart.items.filter(item => selectedItems.includes(item.cart_id));
    const totalAmount = selected.reduce((sum, item) => sum + getSubtotal(item), 0);
    const totalItems = selected.reduce((sum, item) => sum + item.quantity, 0);
    
    return { amount: totalAmount, items: totalItems };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle checkout redirect
  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      setError("Pilih minimal 1 produk untuk checkout");
      return;
    }
    
    setIsRedirecting(true);
    
    try {
      // Ambil data produk yang dipilih
      const selectedCartItems = cart?.items.filter(item => 
        selectedItems.includes(item.cart_id)
      ) || [];
      
      // Persiapkan data checkout
      const checkoutData: CheckoutData = {
        items: selectedCartItems,
        totalAmount: calculateSelectedTotal().amount,
        totalItems: calculateSelectedTotal().items,
        timestamp: new Date().toISOString()
      };
      
      // Simpan data di sessionStorage (data akan hilang saat tab ditutup)
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      
      // Redirect ke halaman orders
      router.push('/modules/orders');
    } catch (err) {
      console.error("Error during checkout:", err);
      setError("Terjadi kesalahan saat proses checkout");
      setIsRedirecting(false);
    }
  };

  // Loading state
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="hidden md:block h-8 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              {/* Header Skeleton */}
              <div className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
              
              {/* Items Skeleton */}
              {[1, 2].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
            
            {/* Summary Skeleton */}
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!isLoading && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/modules/dashboard" 
                  className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium hidden sm:inline">Kembali</span>
                </Link>
                <div className="hidden md:flex items-center gap-2">
                  <Store className="w-6 h-6 text-emerald-600" />
                  <span className="text-xl font-bold text-gray-900">Bosshype Store</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Cart Content */}
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingCart className="w-16 h-16 text-emerald-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Keranjang Belanja Kosong
          </h1>
          
          <p className="text-gray-600 max-w-md mb-8">
            Belum ada produk di keranjang belanja Anda. Yuk, mulai berbelanja dan temukan produk fashion terbaik!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/modules/dashboard"
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/30"
            >
              <ShoppingBag className="w-5 h-5" />
              Mulai Belanja
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Produk Berkualitas</h3>
              <p className="text-sm text-gray-600">Koleksi fashion terbaru dengan bahan premium</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Truck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Gratis Ongkir</h3>
              <p className="text-sm text-gray-600">Untuk pembelian di atas Rp 500.000</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Pembayaran Aman</h3>
              <p className="text-sm text-gray-600">Transaksi dienkripsi dengan teknologi terkini</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Notification Container - Fixed Position */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
        {error && (
          <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-xl shadow-lg flex items-start gap-3 animate-slide-down">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
            <button 
              onClick={() => setError("")}
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg flex items-start gap-3 animate-slide-down">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-700 text-sm font-medium">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage("")}
              className="flex-shrink-0 text-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/modules/dashboard" 
                className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Kembali</span>
              </Link>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-emerald-600" />
                <span className="text-xl font-bold text-gray-900">Keranjang Saya</span>
                {cart && (
                  <span className="hidden sm:inline bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {cart.total_items} item
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {cart && cart.items.length > 0 && (
                <button
                  onClick={openClearCartModal}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium hidden sm:inline">Hapus Semua</span>
                </button>
              )}
              
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items - Left Column */}
          <div className="lg:col-span-2">
            {/* Cart Header */}
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={cart && selectedItems.length === cart.items.length && cart.items.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <span className="font-medium text-gray-900">Pilih Semua</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-emerald-600">{selectedItems.length}</span> dari{" "}
                  <span>{cart?.items.length || 0}</span> produk terpilih
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {cart?.items.map((item) => (
                <div
                  key={item.cart_id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Checkbox - Mobile Top */}
                    <div className="flex sm:hidden items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.cart_id)}
                        onChange={() => toggleItemSelection(item.cart_id)}
                        className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">Pilih item</span>
                    </div>

                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                        <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={item.product_image || "/placeholder-product.jpg"}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-product.jpg";
                            }}
                          />
                        </div>
                        {item.discount_price && item.discount_price > 0 && (
                          <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-br-lg">
                            {getDiscountPercentage(item)}% OFF
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Desktop Checkbox */}
                          <div className="hidden sm:flex items-center gap-3 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.cart_id)}
                              onChange={() => toggleItemSelection(item.cart_id)}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-500">Pilih</span>
                          </div>

                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 line-clamp-2">
                            {item.product_name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{item.category_name}</p>
                          
                          {/* Price - FIXED CALCULATION */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {item.discount_price && item.discount_price > 0 ? (
                              <>
                                <span className="text-lg font-bold text-emerald-600">
                                  {formatCurrency(getFinalPrice(item))}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatCurrency(item.price)}
                                </span>
                                <span className="text-xs bg-gradient-to-r from-red-100 to-red-50 text-red-600 px-2 py-1 rounded font-medium">
                                  Hemat {formatCurrency(item.discount_price)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(item.price)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => openDeleteModal(item.cart_id, item.product_id, item.product_name)}
                          className="self-start sm:self-start text-gray-400 hover:text-red-500 transition-colors p-2 -mt-2 -mr-2 sm:mt-0 sm:mr-0"
                          title="Hapus"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Quantity Controls & Subtotal */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 hidden sm:inline">Jumlah:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.cart_id, item.product_id, item.quantity - 1)}
                              disabled={isUpdating === item.cart_id || item.quantity <= 1}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            
                            {/* PERBAIKAN: Tambahkan text-gray-900 untuk kontras warna */}
                            <div className="px-4 py-2 text-center min-w-[50px] font-medium text-gray-900">
                              {isUpdating === item.cart_id ? (
                                <Loader2 className="w-4 h-4 animate-spin mx-auto text-emerald-500" />
                              ) : (
                                item.quantity
                              )}
                            </div>
                            
                            <button
                              onClick={() => updateQuantity(item.cart_id, item.product_id, item.quantity + 1)}
                              disabled={isUpdating === item.cart_id || item.quantity >= item.stock}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <span className="text-xs text-gray-500">
                            Stok: {item.stock}
                          </span>
                        </div>

                        {/* Subtotal - FIXED CALCULATION */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Subtotal</p>
                          <p className="text-lg font-bold text-emerald-600">
                            {formatCurrency(getSubtotal(item))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Summary Card */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-4">
                <h3 className="font-bold text-gray-900 text-lg mb-6">Ringkasan Belanja</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Harga ({calculateSelectedTotal().items} barang)</span>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(calculateSelectedTotal().amount)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Diskon</span>
                    <div className="text-right">
                      <span className="font-medium text-emerald-600">
                        - {formatCurrency(
                          cart?.items
                            .filter(item => selectedItems.includes(item.cart_id))
                            .reduce((sum, item) => 
                              sum + (item.discount_price && item.discount_price > 0 ? item.discount_price * item.quantity : 0), 0
                            ) || 0
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estimasi Ongkir</span>
                    <div className="text-right">
                      <span className="font-medium text-emerald-600">Gratis</span>
                      <p className="text-xs text-gray-500">Min. belanja Rp 500.000</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Tagihan</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(calculateSelectedTotal().amount)}
                        </span>
                        {calculateSelectedTotal().amount < 500000 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Tambah Rp {formatCurrency(500000 - calculateSelectedTotal().amount).replace('Rp', '')} untuk gratis ongkir
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0 || isRedirecting}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/30"
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Mengarahkan...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Checkout ({selectedItems.length})</span>
                    </>
                  )}
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Dengan melanjutkan, Anda menyetujui Syarat & Ketentuan
                </p>
              </div>

              {/* Security Info */}
              <div className="bg-gradient-to-r from-emerald-50 to-white rounded-xl p-5 border border-emerald-100 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">
                      Belanja 100% Aman
                    </p>
                    <p className="text-xs text-gray-500">
                      Transaksi dienkripsi dan terlindungi
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Garansi uang kembali 30 hari</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Bebas biaya transaksi</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Dukungan pelanggan 24/7</span>
                  </div>
                </div>
              </div>

              {/* Promo Banner */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Truck className="w-6 h-6" />
                  <span className="font-bold text-lg">Gratis Ongkir!</span>
                </div>
                <p className="text-sm opacity-90">
                  Dapatkan gratis ongkir untuk pembelian minimal Rp 500.000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total ({calculateSelectedTotal().items} barang)</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(calculateSelectedTotal().amount)}
            </p>
            {calculateSelectedTotal().amount < 500000 && (
              <p className="text-xs text-gray-500 mt-1">
                +Rp {formatCurrency(500000 - calculateSelectedTotal().amount).replace('Rp', '')} untuk gratis ongkir
              </p>
            )}
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={selectedItems.length === 0 || isRedirecting}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRedirecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CreditCard className="w-5 h-5" />
            )}
            <span>{isRedirecting ? 'Mengarahkan...' : 'Checkout'}</span>
          </button>
        </div>
      </div>

      {/* Delete Item Modal */}
      {deleteModal.isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
            onClick={closeDeleteModal}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-modal-appear">
            <div 
              className="bg-white rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Hapus Produk
                  </h2>
                  <button
                    onClick={closeDeleteModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-gray-700 mb-2">
                      Apakah Anda yakin ingin menghapus produk ini dari keranjang?
                    </p>
                    <p className="font-medium text-gray-900">
                      {deleteModal.productName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors"
                  >
                    Batal
                  </button>
                  
                  <button
                    onClick={removeItem}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus</span>
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Produk akan dihapus dari keranjang belanja Anda
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Clear Cart Modal */}
      {clearCartModal.isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
            onClick={closeClearCartModal}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-modal-appear">
            <div 
              className="bg-white rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Hapus Semua Produk
                  </h2>
                  <button
                    onClick={closeClearCartModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-gray-700 mb-2">
                      Apakah Anda yakin ingin mengosongkan keranjang belanja?
                    </p>
                    <p className="font-medium text-gray-900">
                      {cart?.items.length || 0} produk akan dihapus dari keranjang
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={closeClearCartModal}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors"
                  >
                    Batal
                  </button>
                  
                  <button
                    onClick={clearCart}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Semua</span>
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Semua produk akan dihapus secara permanen dari keranjang belanja Anda
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes slide-down {
          from { 
            opacity: 0; 
            transform: translate(-50%, -20px); 
          }
          to { 
            opacity: 1; 
            transform: translate(-50%, 0); 
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-modal-appear {
          animation: modal-appear 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Padding bottom for mobile nav */
        @media (max-width: 1024px) {
          body {
            padding-bottom: 88px;
          }
        }
      `}</style>
    </div>
  );
}