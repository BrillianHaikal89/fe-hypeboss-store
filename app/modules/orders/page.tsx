// app/modules/orders/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from 'next/dynamic';
import PaymentStatus from './components/PaymentStatus';
import {
  Package,
  Truck,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  FileText,
  Shield,
  ExternalLink,
  ShoppingCart,
  MessageSquare,
  Calendar,
  CreditCard as CardIcon,
  Banknote,
  QrCode,
  Smartphone,
  Store,
  X
} from "lucide-react";
import { useAuthStore } from "../../store/auth-store";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  original_price: number;
  discount_price: number;
  quantity: number;
  subtotal: number;
  product_image: string;
}

interface OrderData {
  id: number;
  order_code: string;
  user_id: number;
  total_amount: number;
  shipping_cost: number;
  final_amount: number;
  shipping_address: string;
  shipping_phone: string;
  notes: string;
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'challenge' | 'expired';
  payment_method: string;
  payment_proof: string | null;
  created_at: string;
  updated_at: string;
  midtrans_transaction_id: string | null;
  payment_type: string | null;
  user_name: string;
  user_phone: string;
  items: OrderItem[];
}

interface PaymentData {
  token: string;
  redirect_url: string;
  transaction_id?: string;
}

interface OrderSummary {
  total_original_price: number;
  total_discount: number;
  total_after_discount: number;
  shipping_cost: number;
  final_amount: number;
}

interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    order: OrderData;
    payment: PaymentData;
    summary: OrderSummary;
  };
}

interface CartItem {
  cart_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  price: number;
  discount_price: number;
  final_price: number;
  quantity: number;
  stock: number;
  subtotal: number;
}

interface CheckoutData {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  timestamp: string;
}

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: any) => void;
    };
    snapLoaded: boolean;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, token, user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [paymentToken, setPaymentToken] = useState("");
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [midtransLoaded, setMidtransLoaded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [formData, setFormData] = useState({
    shipping_address: user?.address || "",
    shipping_phone: user?.phone || "",
    notes: "",
    shipping_cost: 10500,
    payment_method: "bank_transfer"
  });
  
  const [formErrors, setFormErrors] = useState<{
    shipping_address?: string;
    shipping_phone?: string;
  }>({});
  
  const paymentMethods = [
    { value: "bank_transfer", label: "Transfer Bank", icon: <Banknote className="w-5 h-5" />, description: "Transfer manual ke rekening bank" },
    { value: "credit_card", label: "Kartu Kredit", icon: <CardIcon className="w-5 h-5" />, description: "Visa, MasterCard, JCB" },
    { value: "gopay", label: "GoPay", icon: <Smartphone className="w-5 h-5" />, description: "Bayar dengan GoPay" },
    { value: "shopeepay", label: "ShopeePay", icon: <Smartphone className="w-5 h-5" />, description: "Bayar dengan ShopeePay" },
    { value: "qris", label: "QRIS", icon: <QrCode className="w-5 h-5" />, description: "Scan QR Code" }
  ];
  
  const hasLoadedScript = useRef(false);
  const hasProcessedCheckout = useRef(false);

  // Handle Midtrans redirect
  useEffect(() => {
    const status = searchParams.get('status');
    const order_id = searchParams.get('order_id');
    const transaction_status = searchParams.get('transaction_status');
    
    if (transaction_status) {
      handleMidtransResponse(transaction_status, order_id);
    } else if (status && order_id) {
      handleStatusResponse(status, order_id);
    }
  }, [searchParams]);

  const handleMidtransResponse = (transaction_status: string, order_id: string | null) => {
    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        setPaymentStatus('success');
        setSuccessMessage("🎉 Pembayaran berhasil! Pesanan Anda sedang diproses.");
        if (order_id && token) {
          fetchOrderData(order_id);
        }
        setTimeout(() => {
          router.replace(`/modules/orders/confirmation?order_id=${order_id}&status=success`);
        }, 3000);
        break;
      case 'pending':
        setPaymentStatus('pending');
        setSuccessMessage("⏳ Pembayaran tertunda. Silakan selesaikan pembayaran Anda.");
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        setPaymentStatus('error');
        setError("❌ Pembayaran dibatalkan atau gagal. Silakan coba lagi.");
        break;
    }
  };

  const handleStatusResponse = (status: string, order_id: string) => {
    setPaymentStatus(status);
    if (status === 'success') {
      setSuccessMessage("🎉 Pembayaran berhasil! Pesanan Anda sedang diproses.");
      if (order_id && token) {
        fetchOrderData(order_id);
      }
    } else if (status === 'pending') {
      setSuccessMessage("⏳ Pembayaran tertunda. Silakan selesaikan pembayaran Anda.");
    } else if (status === 'error' || status === 'cancel') {
      setError("❌ Terjadi kesalahan saat pembayaran. Silakan coba lagi.");
    }
  };

  // Fetch order data - SESUAI DENGAN DOKUMENTASI
  const fetchOrderData = async (orderId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Gagal mengambil data pesanan`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setOrderData(result.data);
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || "Gagal mengambil data pesanan");
    }
  };

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      router.replace("/login");
      return;
    }
  }, [isAuthenticated, router]);

  // Fetch cart data untuk checkout
  const fetchCheckoutData = useCallback(async () => {
    if (!token || hasProcessedCheckout.current) return;
    
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch(`${API_BASE_URL}/carts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Gagal mengambil data keranjang`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data?.items || data.data.items.length === 0) {
        setError("❌ Keranjang belanja Anda kosong");
        setTimeout(() => {
          router.replace('/modules/carts');
        }, 2000);
        return;
      }
      
      const checkoutItems: CartItem[] = data.data.items.map((item: any) => {
        const price = item.price || 0;
        const discountPrice = item.discount_price || 0;
        const finalPrice = discountPrice > 0 ? price - discountPrice : price;
        const subtotal = finalPrice * (item.quantity || 1);
        
        return {
          cart_id: item.cart_id || item.id || 0,
          product_id: item.product_id || 0,
          product_name: item.product_name || 'Produk',
          product_image: item.product_image || '/placeholder-product.jpg',
          price: price,
          discount_price: discountPrice,
          final_price: finalPrice,
          quantity: item.quantity || 1,
          stock: item.stock || 0,
          subtotal: subtotal
        };
      });
      
      const totalAmount = checkoutItems.reduce((total, item) => total + item.subtotal, 0);
      const totalItems = checkoutItems.reduce((total, item) => total + item.quantity, 0);
      
      const checkoutData: CheckoutData = {
        items: checkoutItems,
        totalAmount,
        totalItems,
        timestamp: new Date().toISOString()
      };
      
      setCheckoutData(checkoutData);
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      
      // Pre-fill form dengan user data
      if (user) {
        setFormData(prev => ({
          ...prev,
          shipping_phone: user.phone || "",
          shipping_address: user.address || ""
        }));
      }
      
      // Load saved order
      const savedOrder = sessionStorage.getItem('currentOrder');
      if (savedOrder) {
        try {
          const order = JSON.parse(savedOrder);
          setOrderData(order.order);
          setPaymentToken(order.paymentToken);
        } catch (e) {
          console.error('Error parsing saved order:', e);
        }
      }
      
    } catch (err: any) {
      console.error('Error loading checkout data:', err);
      setError(`❌ ${err.message || "Gagal memuat data checkout"}`);
      
      // Fallback to sessionStorage
      try {
        const data = sessionStorage.getItem('checkoutData');
        if (data) {
          const parsedData = JSON.parse(data);
          setCheckoutData(parsedData);
        }
      } catch (fallbackErr) {
        console.error('Error loading from sessionStorage:', fallbackErr);
      }
    } finally {
      hasProcessedCheckout.current = true;
      setIsLoading(false);
    }
  }, [token, user, router]);

  // Load checkout data on mount
  useEffect(() => {
    if (!token) return;
    
    try {
      const savedCheckoutData = sessionStorage.getItem('checkoutData');
      if (savedCheckoutData) {
        const parsedData = JSON.parse(savedCheckoutData);
        setCheckoutData(parsedData);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error('Error loading from sessionStorage:', e);
    }
    
    fetchCheckoutData();
  }, [token, fetchCheckoutData]);

  // Load Midtrans Snap script
  useEffect(() => {
    if (hasLoadedScript.current || window.snapLoaded) {
      setMidtransLoaded(true);
      return;
    }

    if (window.snap) {
      setMidtransLoaded(true);
      return;
    }

    hasLoadedScript.current = true;

    const loadScript = () => {
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute(
        'data-client-key',
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YourClientKey'
      );
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Midtrans Snap script loaded');
        window.snapLoaded = true;
        setMidtransLoaded(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Midtrans Snap script');
        setError("❌ Gagal memuat sistem pembayaran. Silakan refresh halaman.");
      };
      
      document.head.appendChild(script);
    };

    loadScript();
  }, []);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'shipping_cost' ? parseInt(value) : value
    }));
    
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: {
      shipping_address?: string;
      shipping_phone?: string;
    } = {};
    
    const address = formData.shipping_address.trim();
    const phone = formData.shipping_phone.trim();
    
    if (!address) {
      errors.shipping_address = "Alamat pengiriman harus diisi";
    } else if (address.length < 10) {
      errors.shipping_address = "Alamat terlalu pendek, minimal 10 karakter";
    }
    
    if (!phone) {
      errors.shipping_phone = "Nomor telepon harus diisi";
    } else if (!/^[0-9]{10,13}$/.test(phone)) {
      errors.shipping_phone = "Nomor telepon tidak valid (10-13 digit)";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create order function - SESUAI DENGAN DOKUMENTASI
  const createOrder = useCallback(async () => {
    if (!token || !checkoutData) {
      setError("❌ Token atau data checkout tidak tersedia");
      return;
    }

    if (!validateForm()) {
      setError("❌ Harap perbaiki data pengiriman Anda");
      return;
    }
    
    setIsCreatingOrder(true);
    setError("");
    setSuccessMessage("");

    try {
      const orderPayload = {
        shipping_address: formData.shipping_address.trim(),
        shipping_phone: formData.shipping_phone.trim(),
        notes: formData.notes.trim(),
        shipping_cost: getTotalAfterDiscount() >= 500000 ? 0 : formData.shipping_cost,
        payment_method: formData.payment_method
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Menggunakan endpoint sesuai dokumentasi
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Gagal membuat pesanan'}`);
      }

      const result: OrderResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal membuat pesanan");
      }
      
      setOrderData(result.data.order);
      setPaymentToken(result.data.payment.token);
      
      sessionStorage.setItem('currentOrder', JSON.stringify({
        order: result.data.order,
        paymentToken: result.data.payment.token
      }));
      
      sessionStorage.removeItem('checkoutData');
      
      // Clear cart setelah order berhasil dibuat
      try {
        await fetch(`${API_BASE_URL}/carts/clear`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (cartError) {
        console.error('Error clearing cart:', cartError);
      }
      
      setSuccessMessage("🎉 Pesanan berhasil dibuat! Silakan lanjutkan pembayaran.");
      setShowPaymentModal(true);
      
    } catch (err: any) {
      console.error('Error creating order:', err);
      if (err.name === 'AbortError') {
        setError("⏱️ Permintaan timeout. Silakan coba lagi.");
      } else {
        setError(`❌ ${err.message || "Terjadi kesalahan saat membuat pesanan"}`);
      }
    } finally {
      setIsCreatingOrder(false);
    }
  }, [token, checkoutData, formData]);

  // Handle payment with Midtrans Snap
  const handlePayment = useCallback(() => {
    if (!paymentToken) {
      setError("❌ Token pembayaran tidak tersedia");
      return;
    }

    if (!window.snap) {
      setError("❌ Sistem pembayaran belum siap. Silakan refresh halaman.");
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    setError("");
    setIsProcessingPayment(true);

    const snapOptions = {
      onSuccess: function(result: any) {
        console.log('Payment success:', result);
        setIsProcessingPayment(false);
        setSuccessMessage("🎉 Pembayaran berhasil! Pesanan Anda sedang diproses.");
        setPaymentStatus('success');
        
        if (orderData) {
          setOrderData({
            ...orderData,
            payment_status: 'paid',
            order_status: 'processing'
          });
        }
        
        sessionStorage.removeItem('currentOrder');
        sessionStorage.removeItem('checkoutData');
        
        setTimeout(() => {
          router.replace(`/modules/orders/confirmation?order_id=${orderData?.id}&status=success`);
        }, 2000);
      },
      onPending: function(result: any) {
        console.log('Payment pending:', result);
        setIsProcessingPayment(false);
        setSuccessMessage("⏳ Pembayaran tertunda. Silakan selesaikan pembayaran Anda.");
        setPaymentStatus('pending');
        setShowPaymentModal(false);
      },
      onError: function(result: any) {
        console.log('Payment error:', result);
        setIsProcessingPayment(false);
        setError("❌ Terjadi kesalahan saat pembayaran. Silakan coba lagi.");
        setPaymentStatus('error');
        setShowPaymentModal(false);
      },
      onClose: function() {
        console.log('Payment popup closed');
        setIsProcessingPayment(false);
        setSuccessMessage("ℹ️ Popup pembayaran ditutup. Silakan lanjutkan pembayaran jika belum selesai.");
        setShowPaymentModal(false);
      }
    };

    window.snap.pay(paymentToken, snapOptions);
  }, [paymentToken, orderData, router]);

  // Calculate final price
  const calculateFinalPrice = useCallback((item: CartItem | OrderItem) => {
    if ('price' in item) {
      // CartItem
      const price = item.price || 0;
      const discountPrice = (item as CartItem).discount_price || 0;
      return discountPrice > 0 ? price - discountPrice : price;
    } else {
      // OrderItem
      return item.product_price;
    }
  }, []);

  // Calculate item subtotal
  const calculateItemSubtotal = useCallback((item: CartItem | OrderItem) => {
    if ('quantity' in item) {
      const finalPrice = calculateFinalPrice(item);
      return finalPrice * item.quantity;
    }
    return 0;
  }, [calculateFinalPrice]);

  // Calculate total discount
  const calculateTotalDiscount = useCallback(() => {
    if (orderData?.items) {
      return orderData.items.reduce((total, item) => {
        const originalPrice = item.original_price || 0;
        const finalPrice = item.product_price || 0;
        return total + ((originalPrice - finalPrice) * item.quantity);
      }, 0);
    }
    if (checkoutData) {
      return checkoutData.items.reduce((total, item) => {
        return total + (item.discount_price * item.quantity);
      }, 0);
    }
    return 0;
  }, [checkoutData, orderData]);

  // Calculate total original price
  const calculateTotalOriginalPrice = useCallback(() => {
    if (orderData?.items) {
      return orderData.items.reduce((total, item) => {
        const originalPrice = item.original_price || item.product_price || 0;
        return total + (originalPrice * item.quantity);
      }, 0);
    }
    if (checkoutData) {
      return checkoutData.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }
    return 0;
  }, [checkoutData, orderData]);

  // Calculate total after discount
  const getTotalAfterDiscount = useCallback(() => {
    if (orderData) {
      return orderData.total_amount;
    }
    if (checkoutData) {
      return checkoutData.items.reduce((total, item) => {
        return total + calculateItemSubtotal(item);
      }, 0);
    }
    return 0;
  }, [checkoutData, orderData, calculateItemSubtotal]);

  // Format currency
  const formatCurrency = useCallback((amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numAmount);
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }, []);

  // Calculate discount percentage
  const discountPercentage = (item: CartItem | OrderItem) => {
    let originalPrice = 0;
    let discountAmount = 0;
    
    if ('price' in item) {
      // CartItem
      originalPrice = item.price;
      discountAmount = item.discount_price || 0;
    } else {
      // OrderItem
      originalPrice = item.original_price || item.product_price || 0;
      discountAmount = item.original_price - item.product_price;
    }
    
    if (discountAmount > 0 && originalPrice > 0) {
      return Math.round((discountAmount / originalPrice) * 100);
    }
    return 0;
  };

  // Calculate total quantity
  const getTotalQuantity = useCallback(() => {
    if (orderData?.items) {
      return orderData.items.reduce((total, item) => total + item.quantity, 0);
    }
    if (checkoutData?.items) {
      return checkoutData.items.reduce((total, item) => total + item.quantity, 0);
    }
    return 0;
  }, [orderData, checkoutData]);

  // Calculate total amount
  const getTotalAmount = useCallback(() => {
    if (orderData) {
      return orderData.final_amount;
    }
    if (checkoutData) {
      const subtotal = getTotalAfterDiscount();
      const shipping = getTotalAfterDiscount() >= 500000 ? 0 : formData.shipping_cost;
      return subtotal + shipping;
    }
    return 0;
  }, [orderData, checkoutData, formData.shipping_cost, getTotalAfterDiscount]);

  // Calculate subtotal
  const getSubtotal = useCallback(() => {
    if (orderData) {
      return orderData.total_amount;
    }
    if (checkoutData) {
      return getTotalAfterDiscount();
    }
    return 0;
  }, [orderData, checkoutData, getTotalAfterDiscount]);

  // Get items
  const getItems = useCallback(() => {
    if (orderData?.items) {
      return orderData.items;
    }
    if (checkoutData?.items) {
      return checkoutData.items;
    }
    return [];
  }, [orderData, checkoutData]);

  // Check free shipping
  const isFreeShipping = useCallback(() => {
    if (orderData) {
      return orderData.shipping_cost === 0;
    }
    if (checkoutData) {
      return getTotalAfterDiscount() >= 500000;
    }
    return false;
  }, [orderData, checkoutData, getTotalAfterDiscount]);

  // Loading state
  if (!isLoading && (!checkoutData && !orderData)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Keranjang Kosong</h2>
          <p className="text-gray-600 mb-6">Silakan tambahkan produk ke keranjang terlebih dahulu</p>
          <Link
            href="/modules/carts"
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Keranjang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Loading Overlay */}
      {isCreatingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Membuat Pesanan Anda</h3>
              <p className="text-gray-600 mb-6">
                Harap tunggu sebentar, pesanan Anda sedang diproses...
              </p>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-gray-500">Proses ini mungkin membutuhkan beberapa detik</p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Container */}
      {(error || successMessage) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
          {error && (
            <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-xl shadow-lg flex items-start gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
              <button 
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg flex items-start gap-3 animate-slide-down">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-700 text-sm font-medium flex-1">{successMessage}</p>
              <button 
                onClick={() => setSuccessMessage("")}
                className="text-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/modules/carts" 
                className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Kembali ke Keranjang</span>
              </Link>
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-600" />
                <span className="text-xl font-bold text-gray-900">Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Shipping Information Form */}
            {!orderData && checkoutData && (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Informasi Pengiriman</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="shipping_address">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Alamat Pengiriman *
                      </span>
                    </label>
                    <textarea
                      id="shipping_address"
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 placeholder:text-gray-500 transition-colors ${
                        formErrors.shipping_address 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                      } ${isCreatingOrder ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="Masukkan alamat lengkap pengiriman"
                      disabled={isCreatingOrder}
                    />
                    {formErrors.shipping_address && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.shipping_address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="shipping_phone">
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Nomor Telepon *
                      </span>
                    </label>
                    <input
                      type="tel"
                      id="shipping_phone"
                      name="shipping_phone"
                      value={formData.shipping_phone}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 placeholder:text-gray-500 transition-colors ${
                        formErrors.shipping_phone 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                      } ${isCreatingOrder ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="Contoh: 082126510230"
                      disabled={isCreatingOrder}
                    />
                    {formErrors.shipping_phone && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.shipping_phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="notes">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Pesan untuk Penjual (Opsional)
                      </span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500 ${
                        isCreatingOrder ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Contoh: Tolong dibungkus rapi"
                      disabled={isCreatingOrder}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="shipping_cost">
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Pilihan Pengiriman
                      </span>
                    </label>
                    <select
                      id="shipping_cost"
                      name="shipping_cost"
                      value={formData.shipping_cost}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 ${
                        isCreatingOrder ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      disabled={isCreatingOrder || getTotalAfterDiscount() >= 500000}
                    >
                      <option value={10500}>Reguler (2-3 hari) - Rp 10.500</option>
                      <option value={20000}>Express (1 hari) - Rp 20.000</option>
                      <option value={15000}>Same Day - Rp 15.000</option>
                      <option value={0}>Ambil di Toko - Rp 0</option>
                    </select>
                    {getTotalAfterDiscount() >= 500000 && (
                      <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                        🎉 Anda mendapatkan gratis ongkir!
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Metode Pembayaran
                      </span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            formData.payment_method === method.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-200'
                          } ${isCreatingOrder ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => !isCreatingOrder && setFormData(prev => ({ ...prev, payment_method: method.value }))}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                formData.payment_method === method.value
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {method.icon}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{method.label}</p>
                                <p className="text-sm text-gray-500">{method.description}</p>
                              </div>
                            </div>
                            {formData.payment_method === method.value && (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Item Pesanan</h2>
                {orderData?.order_code && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Kode Pesanan</p>
                    <p className="font-mono font-bold text-emerald-600 text-sm sm:text-base">
                      {orderData.order_code}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Status */}
              {orderData && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-100">
                  <PaymentStatus 
                    orderStatus={orderData.order_status}
                    paymentStatus={orderData.payment_status}
                  />
                </div>
              )}

              {/* Shipping Info if order exists */}
              {orderData && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Alamat Pengiriman</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{orderData.shipping_address}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {orderData.shipping_phone}
                      </span>
                      {orderData.notes && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {orderData.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-4">
                {getItems().map((item: any, index: number) => {
                  const isCartItem = 'discount_price' in item;
                  const originalPrice = isCartItem 
                    ? item.price 
                    : item.original_price || item.product_price || 0;
                  const discountPrice = isCartItem 
                    ? item.discount_price 
                    : item.original_price - item.product_price;
                  const finalPrice = calculateFinalPrice(item);
                  const subtotal = calculateItemSubtotal(item);
                  const itemDiscountTotal = discountPrice * item.quantity;
                  const discountPercent = discountPercentage(item);
                  
                  return (
                    <div key={item.id || item.product_id || item.cart_id || index} className="flex items-start border border-gray-200 rounded-lg p-4">
                      {item.product_image && (
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg mr-4 flex-shrink-0"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-base sm:text-lg mb-2">
                          {item.product_name}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {discountPrice > 0 ? (
                            <>
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(finalPrice)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(originalPrice)}
                              </span>
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">
                                Diskon {discountPercent}%
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(finalPrice)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-gray-600">
                              Jumlah: <span className="text-gray-900 font-medium">{item.quantity}</span>
                            </p>
                            {discountPrice > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Diskon total: <span className="text-red-600">-{formatCurrency(itemDiscountTotal)}</span>
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {discountPrice > 0 && (
                              <p className="text-xs text-gray-500 line-through mb-1">
                                {formatCurrency(originalPrice * item.quantity)}
                              </p>
                            )}
                            <p className="font-semibold text-emerald-600 text-base">
                              Subtotal: {formatCurrency(subtotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 mb-6">
                <h3 className="font-bold text-gray-900 text-lg mb-6">Ringkasan Pembayaran</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Harga Asli ({getTotalQuantity()} barang)</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(calculateTotalOriginalPrice())}
                    </span>
                  </div>
                  
                  {calculateTotalDiscount() > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Diskon</span>
                      <span className="font-medium text-red-600">
                        - {formatCurrency(calculateTotalDiscount())}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(getSubtotal())}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Biaya Pengiriman</span>
                    <span className={`font-medium ${isFreeShipping() ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {isFreeShipping() ? 'GRATIS' : formatCurrency(formData.shipping_cost)}
                    </span>
                  </div>
                  
                  {isFreeShipping() && checkoutData && (
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 rounded-lg">
                      <p className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Anda mendapatkan gratis ongkir!
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Pembayaran</span>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                          {formatCurrency(getTotalAmount())}
                        </span>
                        {checkoutData && getTotalAfterDiscount() < 500000 && !orderData && (
                          <p className="text-xs text-gray-500 mt-1">
                            Tambah Rp {formatCurrency(500000 - getTotalAfterDiscount()).replace('Rp', '')} untuk gratis ongkir
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {!orderData ? (
                  <div className="space-y-3">
                    <button
                      onClick={createOrder}
                      disabled={isCreatingOrder || !formData.shipping_address.trim() || !formData.shipping_phone.trim() || Object.keys(formErrors).length > 0}
                      className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/30"
                    >
                      {isCreatingOrder ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5" />
                          <span>Buat Pesanan</span>
                        </>
                      )}
                    </button>
                    
                    {(!formData.shipping_address.trim() || !formData.shipping_phone.trim()) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Lengkapi data pengiriman untuk melanjutkan
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderData.payment_status !== 'paid' && (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={isProcessingPayment}
                        className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/30"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Menyiapkan...</span>
                          </>
                        ) : paymentStatus === 'pending' ? (
                          <>
                            <Clock className="w-5 h-5" />
                            <span>Lanjutkan Pembayaran</span>
                          </>
                        ) : paymentStatus === 'success' ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Pembayaran Berhasil</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            <span>Bayar Sekarang</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    {orderData.payment_status === 'pending' && (
                      <button
                        onClick={() => router.replace(`/modules/dashboard?tab=orders&order_id=${orderData.id}`)}
                        className="w-full py-3 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Lihat Detail Pesanan</span>
                      </button>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Dengan melanjutkan, Anda menyetujui Syarat & Ketentuan
                </p>
              </div>

              {/* Security Info */}
              {!orderData && (
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
              )}

              {/* Order Info */}
              {orderData && (
                <div className="bg-gradient-to-r from-emerald-50 to-white rounded-xl p-5 border border-emerald-100">
                  <h4 className="font-bold text-gray-900 mb-3">Informasi Pesanan</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal Pesanan</span>
                      <span className="font-medium text-gray-900">{formatDate(orderData.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metode Pembayaran</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {orderData.payment_method?.replace('_', ' ') || 'Bank Transfer'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nama Pemesan</span>
                      <span className="font-medium text-gray-900">{orderData.user_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nomor Telepon</span>
                      <span className="font-medium text-gray-900">{orderData.user_phone}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
            onClick={() => !isProcessingPayment && setShowPaymentModal(false)}
          />
          
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Pembayaran Pesanan
                  </h2>
                  <button
                    onClick={() => !isProcessingPayment && setShowPaymentModal(false)}
                    disabled={isProcessingPayment}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                {orderData && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Kode Pesanan:</span>
                      <span className="font-bold text-emerald-600">{orderData.order_code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Pembayaran:</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(orderData.final_amount)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Selesaikan Pembayaran Anda
                  </h3>
                  <p className="text-gray-600">
                    Anda akan diarahkan ke halaman pembayaran Midtrans yang aman
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Instruksi Pembayaran:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Pilih metode pembayaran yang tersedia</li>
                    <li>• Ikuti instruksi pada halaman pembayaran</li>
                    <li>• Simpan bukti pembayaran Anda</li>
                    <li>• Status akan otomatis diperbarui setelah pembayaran berhasil</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-3">Metode Pembayaran Tersedia:</p>
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map((method) => (
                      <div key={method.value} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <span className="text-emerald-600">{method.icon}</span>
                        <span className="text-sm text-gray-900">{method.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePayment}
                    disabled={isProcessingPayment || !midtransLoaded}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menyiapkan Pembayaran...</span>
                      </>
                    ) : !midtransLoaded ? (
                      <>
                        <Clock className="w-5 h-5" />
                        <span>Menyiapkan Sistem...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        <span>Lanjutkan ke Pembayaran</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={isProcessingPayment}
                    className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  >
                    Nanti Saja
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Pembayaran diproses oleh Midtrans - Payment Gateway yang aman dan terpercaya
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total ({getTotalQuantity()} barang)</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(getTotalAmount())}
            </p>
            {checkoutData && getTotalAfterDiscount() < 500000 && !orderData && (
              <p className="text-xs text-gray-500 mt-1">
                +Rp {formatCurrency(500000 - getTotalAfterDiscount()).replace('Rp', '')} untuk gratis ongkir
              </p>
            )}
          </div>
          
          {!orderData ? (
            <button
              onClick={createOrder}
              disabled={isCreatingOrder || !formData.shipping_address.trim() || !formData.shipping_phone.trim() || Object.keys(formErrors).length > 0}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreatingOrder ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
              <span>
                {isCreatingOrder ? 'Memproses...' : 'Buat Pesanan'}
              </span>
            </button>
          ) : orderData.payment_status !== 'paid' ? (
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={isProcessingPayment}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Bayar Sekarang</span>
            </button>
          ) : null}
        </div>
      </div>

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
        
        @media (max-width: 1024px) {
          body {
            padding-bottom: 88px;
          }
        }
      `}</style>
    </div>
  );
}