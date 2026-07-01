// app/modules/orders/components/PaymentStatus.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Package, 
  Truck, 
  Home, 
  ShoppingBag, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CreditCard,
  MessageSquare,
  Download,
  Share2,
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth-store';
// Hapus import PaymentStatus yang bermasalah
// import PaymentStatus from '../components/PaymentStatus';

// Definisikan komponen PaymentStatus di sini
interface PaymentStatusProps {
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'challenge' | 'expired';
}

const PaymentStatusComponent: React.FC<PaymentStatusProps> = ({ orderStatus, paymentStatus }) => {
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      shipped: 'bg-indigo-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
      paid: 'bg-emerald-500',
      failed: 'bg-red-500',
      refunded: 'bg-purple-500',
      challenge: 'bg-orange-500',
      expired: 'bg-gray-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Menunggu',
      processing: 'Diproses',
      shipped: 'Dikirim',
      delivered: 'Sampai',
      cancelled: 'Dibatalkan',
      paid: 'Lunas',
      failed: 'Gagal',
      refunded: 'Dikembalikan',
      challenge: 'Challenge',
      expired: 'Kadaluarsa'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending':
      case 'paid':
      case 'processing':
        return <Clock className="w-5 h-5" />;
      case 'shipped':
      case 'delivered':
        return <Truck className="w-5 h-5" />;
      case 'cancelled':
      case 'failed':
      case 'expired':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">Status Pesanan</p>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full text-white ${getStatusColor(orderStatus)}`}>
            {getStatusIcon(orderStatus)}
          </div>
          <span className="font-semibold text-gray-900">
            {getStatusText(orderStatus)}
          </span>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">Status Pembayaran</p>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full text-white ${getStatusColor(paymentStatus)}`}>
            {getStatusIcon(paymentStatus)}
          </div>
          <span className="font-semibold text-gray-900">
            {getStatusText(paymentStatus)}
          </span>
        </div>
      </div>
    </div>
  );
};

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
  summary?: {
    total_original_price: number;
    total_discount: number;
    total_after_discount: number;
    shipping_cost: number;
    final_amount: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, token } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'error' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');
  const transactionStatus = searchParams.get('transaction_status');

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      router.replace("/login");
      return;
    }
  }, [isAuthenticated, router]);

  // Fetch order data
  const fetchOrderData = useCallback(async () => {
    if (!token || !orderId) {
      setError('Token atau ID pesanan tidak tersedia');
      setIsLoading(false);
      
      // Set status based on URL param if fetch fails
      if (status === 'success') setPaymentStatus('success');
      else if (status === 'pending') setPaymentStatus('pending');
      else if (status === 'error' || transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
        setPaymentStatus('error');
      }
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching order data for:', orderId);
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Gagal mengambil data pesanan`);
      }
      
      const result = await response.json();
      console.log('Order data result:', result);
      
      if (result.success) {
        setOrderData(result.data);
        
        // Set payment status based on order data
        if (result.data.payment_status === 'paid' || result.data.payment_status === 'settlement') {
          setPaymentStatus('success');
        } else if (result.data.payment_status === 'pending') {
          setPaymentStatus('pending');
        } else if (result.data.payment_status === 'failed' || result.data.payment_status === 'expired' || result.data.payment_status === 'cancelled') {
          setPaymentStatus('error');
        }
        
        // Set success message based on status
        if (result.data.payment_status === 'paid') {
          setSuccessMessage('🎉 Pembayaran berhasil! Pesanan Anda akan segera diproses.');
        } else if (result.data.payment_status === 'pending') {
          setSuccessMessage('⏳ Menunggu konfirmasi pembayaran. Silakan selesaikan pembayaran Anda.');
        }
      } else {
        throw new Error(result.message || "Gagal mengambil data pesanan");
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || "Gagal mengambil data pesanan");
      
      // Set status based on URL param if fetch fails
      if (status === 'success' || transactionStatus === 'settlement' || transactionStatus === 'capture') {
        setPaymentStatus('success');
        setSuccessMessage('🎉 Pembayaran berhasil! Silakan refresh halaman untuk melihat detail pesanan.');
      } else if (status === 'pending' || transactionStatus === 'pending') {
        setPaymentStatus('pending');
        setSuccessMessage('⏳ Menunggu konfirmasi pembayaran. Silakan selesaikan pembayaran Anda.');
      } else if (status === 'error' || transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
        setPaymentStatus('error');
        setError('❌ Pembayaran dibatalkan atau gagal. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, orderId, status, transactionStatus]);

  useEffect(() => {
    if (orderId && token) {
      fetchOrderData();
    } else {
      setIsLoading(false);
      // Set status based on URL params
      if (status === 'success' || transactionStatus === 'settlement' || transactionStatus === 'capture') {
        setPaymentStatus('success');
        setSuccessMessage('🎉 Pembayaran berhasil!');
      } else if (status === 'pending' || transactionStatus === 'pending') {
        setPaymentStatus('pending');
        setSuccessMessage('⏳ Menunggu konfirmasi pembayaran.');
      } else if (status === 'error' || transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
        setPaymentStatus('error');
        setError('❌ Pembayaran gagal atau dibatalkan.');
      }
    }
  }, [orderId, token, status, transactionStatus, fetchOrderData]);

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Calculate total discount
  const calculateTotalDiscount = () => {
    if (!orderData?.items) return 0;
    return orderData.items.reduce((total, item) => {
      const originalPrice = item.original_price || item.product_price || 0;
      const finalPrice = item.product_price || 0;
      return total + ((originalPrice - finalPrice) * item.quantity);
    }, 0);
  };

  // Calculate total original price
  const calculateTotalOriginalPrice = () => {
    if (!orderData?.items) return 0;
    return orderData.items.reduce((total, item) => {
      const originalPrice = item.original_price || item.product_price || 0;
      return total + (originalPrice * item.quantity);
    }, 0);
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle share receipt
  const handleShareReceipt = async () => {
    if (navigator.share && orderData) {
      try {
        await navigator.share({
          title: `Struk Pembelian - ${orderData.order_code}`,
          text: `Struk pembelian untuk pesanan ${orderData.order_code} di BOSS STORE`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copy
        handleCopyToClipboard(window.location.href);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyToClipboard(window.location.href);
    }
  };

  // Handle send receipt via WhatsApp
  const handleSendReceipt = async () => {
    if (!orderId || !token) return;
    
    try {
      setIsCheckingStatus(true);
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/whatsapp-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccessMessage('✅ Struk telah dikirim via WhatsApp!');
        } else {
          setError(result.message || 'Gagal mengirim struk');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Gagal mengirim struk`);
      }
    } catch (error: any) {
      console.error('Error sending receipt:', error);
      setError(error.message || 'Gagal mengirim struk via WhatsApp');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Handle check payment status
  const handleCheckStatus = async () => {
    if (!orderId || !token) return;
    
    try {
      setIsCheckingStatus(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/payment/${orderId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccessMessage('✅ Status diperbarui dari Midtrans');
          // Refresh order data
          await fetchOrderData();
        } else {
          setError(result.message || 'Gagal memeriksa status');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Gagal memeriksa status`);
      }
    } catch (error: any) {
      console.error('Error checking status:', error);
      setError(error.message || 'Gagal memeriksa status pembayaran');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Get payment link
  const getPaymentLink = () => {
    if (!orderData) return '#';
    const baseLink = 'https://app.sandbox.midtrans.com/payment-links/1748988501455';
    return `${baseLink}?order_id=${orderData.order_code}&amount=${orderData.final_amount}&customer_name=${encodeURIComponent(orderData.user_name || 'Customer')}`;
  };

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    if (!orderData) return '';
    const message = `Halo admin, saya ingin bertanya tentang pesanan saya:\n\n` +
                   `Kode Pesanan: ${orderData.order_code}\n` +
                   `Nama: ${orderData.user_name}\n` +
                   `Total: ${formatCurrency(orderData.final_amount)}\n` +
                   `Status: ${orderData.payment_status === 'paid' ? 'Sudah Dibayar' : 'Menunggu Pembayaran'}\n\n` +
                   `Bisa dibantu cek status pesanan saya?`;
    return encodeURIComponent(message);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat konfirmasi pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white print:bg-white">
      
      {/* Notification Container */}
      <div className="container mx-auto px-4 py-4 print:hidden">
        {(error || successMessage) && (
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
                <button 
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {successMessage && (
              <div className="mb-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-700 text-sm font-medium flex-1">{successMessage}</p>
                <button 
                  onClick={() => setSuccessMessage("")}
                  className="text-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Status Banner */}
        <div className="max-w-4xl mx-auto mb-8 print:mb-4">
          {paymentStatus === 'success' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 sm:p-8 text-center print:p-4">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 print:text-xl">
                  🎉 Pembayaran Berhasil!
                </h1>
                <p className="text-gray-600 mb-4 max-w-md">
                  Terima kasih telah berbelanja di BOSS STORE. Pesanan Anda telah dikonfirmasi dan akan segera diproses.
                </p>
                {orderData?.order_code && (
                  <div className="bg-white px-4 py-2 rounded-lg inline-block print:border print:border-gray-300">
                    <p className="text-sm text-gray-500">Kode Pesanan</p>
                    <p className="font-mono font-bold text-emerald-600 text-lg print:text-base">{orderData.order_code}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {paymentStatus === 'pending' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center print:p-4">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 print:text-xl">
                  ⏳ Menunggu Pembayaran
                </h1>
                <p className="text-gray-600 mb-4 max-w-md">
                  Silakan selesaikan pembayaran Anda untuk melanjutkan proses pesanan.
                </p>
                {orderData && (
                  <div className="space-y-3">
                    <div className="bg-white px-4 py-2 rounded-lg inline-block print:border print:border-gray-300">
                      <p className="text-sm text-gray-500">Kode Pesanan</p>
                      <p className="font-mono font-bold text-emerald-600 text-lg print:text-base">{orderData.order_code}</p>
                    </div>
                    <a
                      href={getPaymentLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all print:hidden"
                    >
                      <CreditCard className="w-5 h-5" />
                      Lanjutkan Pembayaran
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 sm:p-8 text-center print:p-4">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 print:text-xl">
                  ❌ Pembayaran Gagal
                </h1>
                <p className="text-gray-600 mb-4 max-w-md">
                  Terjadi kesalahan saat proses pembayaran. Silakan coba lagi atau hubungi customer service.
                </p>
                {orderData && (
                  <div className="space-y-3">
                    <div className="bg-white px-4 py-2 rounded-lg inline-block print:border print:border-gray-300">
                      <p className="text-sm text-gray-500">Kode Pesanan</p>
                      <p className="font-mono font-bold text-emerald-600 text-lg print:text-base">{orderData.order_code}</p>
                    </div>
                    <a
                      href={getPaymentLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all print:hidden"
                    >
                      <CreditCard className="w-5 h-5" />
                      Coba Bayar Lagi
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          
        </div>

        {/* Main Content */}
        {orderData && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
              {/* Left Column - Order Details */}
              <div className="lg:col-span-2 space-y-6 print:space-y-4">
                {/* Order Status */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 print:border-0 print:shadow-none print:p-4">
                  <PaymentStatusComponent 
                    orderStatus={orderData.order_status}
                    paymentStatus={orderData.payment_status}
                  />
                </div>

                {/* Payment Actions for Pending Status */}
                {orderData.payment_status === 'pending' && (
                  <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-6 border border-blue-200 print:hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Selesaikan Pembayaran</h3>
                        <p className="text-gray-600">Lanjutkan proses pembayaran melalui Midtrans</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* QR Code Section */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex flex-col items-center">
                          <div className="mb-3">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getPaymentLink())}`} 
                              alt="QR Code Payment" 
                              className="w-48 h-48"
                            />
                          </div>
                          <p className="text-sm text-gray-600">Scan QR Code untuk pembayaran</p>
                        </div>
                      </div>

                      {/* Payment Link */}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Atau klik link pembayaran:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={getPaymentLink()}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm truncate"
                          />
                          <button
                            onClick={() => handleCopyToClipboard(getPaymentLink())}
                            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                          </button>
                          <a
                            href={getPaymentLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Metode Pembayaran Tersedia:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {['Credit Card', 'Bank Transfer', 'GoPay', 'ShopeePay', 'QRIS', 'Alfamart'].map((method) => (
                            <div key={method} className="p-2 bg-gray-100 rounded text-center">
                              <p className="text-xs font-medium">{method}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Check Status Button */}
                      <button
                        onClick={handleCheckStatus}
                        disabled={isCheckingStatus}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCheckingStatus ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                        Cek Status Pembayaran
                      </button>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 print:border-0 print:shadow-none print:p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 print:text-base">Detail Pesanan</h2>
                  <div className="space-y-4 print:space-y-2">
                    {orderData.items.map((item, index) => (
                      <div key={item.id || index} className="flex items-start border border-gray-200 rounded-lg p-4 print:border-0 print:p-2">
                        {item.product_image && (
                          <img 
                            src={item.product_image} 
                            alt={item.product_name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg mr-4 flex-shrink-0 print:hidden"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-base mb-2 print:text-sm">
                            {item.product_name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-lg font-bold text-gray-900 print:text-base">
                              {formatCurrency(item.product_price)}
                            </span>
                            {item.original_price > item.product_price && (
                              <>
                                <span className="text-sm text-gray-500 line-through print:text-xs">
                                  {formatCurrency(item.original_price)}
                                </span>
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded print:text-xs">
                                  Diskon
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center justify-between print:flex-col print:items-start print:gap-1">
                            <p className="text-sm text-gray-600 print:text-xs">
                              Jumlah: <span className="font-medium">{item.quantity}</span>
                            </p>
                            <p className="font-semibold text-emerald-600 print:text-sm">
                              Subtotal: {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 print:border-0 print:shadow-none print:p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 print:text-base">Informasi Pengiriman</h2>
                  <div className="space-y-3 print:space-y-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0 print:w-4 print:h-4" />
                      <div>
                        <p className="font-medium text-gray-900 print:text-sm">Alamat Pengiriman</p>
                        <p className="text-gray-600 print:text-xs">{orderData.shipping_address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500 flex-shrink-0 print:w-4 print:h-4" />
                      <div>
                        <p className="font-medium text-gray-900 print:text-sm">Nomor Telepon</p>
                        <p className="text-gray-600 print:text-xs">{orderData.shipping_phone}</p>
                      </div>
                    </div>
                    {orderData.notes && (
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0 print:w-4 print:h-4" />
                        <div>
                          <p className="font-medium text-gray-900 print:text-sm">Pesan Tambahan</p>
                          <p className="text-gray-600 print:text-xs">{orderData.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* WhatsApp Notification Status */}
                {orderData.payment_status === 'paid' && (
                  <div className="bg-gradient-to-r from-green-50 to-white rounded-xl p-6 border border-green-100 print:hidden">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Notifikasi WhatsApp Terkirim</h3>
                        <p className="text-gray-600">
                          Konfirmasi pembayaran telah dikirim ke WhatsApp Anda dan Admin
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-900 mb-2">📱 Ke Pembeli</p>
                        <p className="text-sm text-gray-600">Konfirmasi pembayaran & struk belanja</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-900 mb-2">👨‍💼 Ke Admin</p>
                        <p className="text-sm text-gray-600">Notifikasi order baru untuk diproses</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-900 mb-2">🚚 Update Pengiriman</p>
                        <p className="text-sm text-gray-600">Status pengiriman akan diupdate nanti</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Order Summary & Actions */}
              <div className="lg:col-span-1 print:hidden">
                <div className="sticky top-6 space-y-6">
                  {/* Order Summary */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 print:shadow-none print:border-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-4 print:text-base">Ringkasan Pesanan</h3>
                    <div className="space-y-3 mb-6 print:space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 print:text-sm">Total Harga Asli</span>
                        <span className="font-medium text-gray-900 print:text-sm">
                          {formatCurrency(calculateTotalOriginalPrice())}
                        </span>
                      </div>
                      
                      {calculateTotalDiscount() > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 print:text-sm">Total Diskon</span>
                          <span className="font-medium text-red-600 print:text-sm">
                            - {formatCurrency(calculateTotalDiscount())}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 print:text-sm">Subtotal</span>
                        <span className="font-medium text-gray-900 print:text-sm">
                          {formatCurrency(orderData.total_amount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 print:text-sm">Biaya Pengiriman</span>
                        <span className={`font-medium ${orderData.shipping_cost === 0 ? 'text-emerald-600' : 'text-gray-900'} print:text-sm`}>
                          {orderData.shipping_cost === 0 ? 'GRATIS' : formatCurrency(orderData.shipping_cost)}
                        </span>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4 print:pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900 print:text-base">Total Pembayaran</span>
                          <span className="text-xl font-bold text-emerald-600 print:text-lg">
                            {formatCurrency(orderData.final_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Information */}
                    <div className="pt-4 border-t border-gray-100 print:pt-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 print:w-3 print:h-3" />
                          <span className="text-gray-600">Tanggal Pesanan:</span>
                          <span className="font-medium text-gray-900">{formatDate(orderData.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-500 print:w-3 print:h-3" />
                          <span className="text-gray-600">Metode Pembayaran:</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {orderData.payment_method?.replace('_', ' ') || 'Bank Transfer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-500 print:w-3 print:h-3" />
                          <span className="text-gray-600">Status Pesanan:</span>
                          <span className={`font-medium ${
                            orderData.order_status === 'processing' ? 'text-blue-600' :
                            orderData.order_status === 'shipped' ? 'text-indigo-600' :
                            orderData.order_status === 'delivered' ? 'text-green-600' :
                            'text-gray-600'
                          }`}>
                            {orderData.order_status === 'pending' && 'Menunggu Pembayaran'}
                            {orderData.order_status === 'processing' && 'Diproses'}
                            {orderData.order_status === 'shipped' && 'Dalam Pengiriman'}
                            {orderData.order_status === 'delivered' && 'Sampai Tujuan'}
                            {orderData.order_status === 'cancelled' && 'Dibatalkan'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-900 text-lg mb-4">Aksi</h3>
                    <div className="space-y-3">
                      <button
                        onClick={handlePrintReceipt}
                        className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Printer className="w-5 h-5" />
                        Cetak Struk
                      </button>
                      
                      <button
                        onClick={handleShareReceipt}
                        className="w-full py-3 border border-blue-300 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" />
                        Bagikan
                      </button>
                      
                      <button
                        onClick={handleSendReceipt}
                        disabled={isCheckingStatus}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isCheckingStatus ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <MessageSquare className="w-5 h-5" />
                        )}
                        Kirim via WhatsApp
                      </button>
                      
                      <a
                        href={`https://wa.me/6281234567890?text=${generateWhatsAppMessage()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Phone className="w-5 h-5" />
                        Hubungi Customer Service
                      </a>
                      
                      <Link
                        href="/"
                        className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-medium rounded-lg hover:from-gray-800 hover:to-gray-950 transition-all flex items-center justify-center gap-2"
                      >
                        <Home className="w-5 h-5" />
                        Kembali Berbelanja
                      </Link>
                    </div>
                  </div>

                  {/* Customer Support */}
                  <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-5 border border-blue-100">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">
                          Butuh Bantuan?
                        </p>
                        <p className="text-xs text-gray-500">
                          Hubungi customer service kami
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span>+62 812 3456 7890</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span>support@bosstore.com</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">
                      Layanan customer service tersedia 24/7
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Section */}
            <div className="hidden print:block">
              {/* Receipt Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">BOSS STORE</h1>
                <p className="text-gray-600">Struk Pembelian</p>
                <p className="text-sm text-gray-500">Jl. Contoh No. 123, Jakarta</p>
              </div>

              {/* Order Info */}
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Kode Pesanan</p>
                    <p className="font-bold">{orderData.order_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal</p>
                    <p className="font-bold">{formatDate(orderData.created_at)}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Nama Pelanggan</p>
                  <p className="font-bold">{orderData.user_name}</p>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 mb-2">Items:</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Produk</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Harga</th>
                      <th className="text-right py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.product_name}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatCurrency(item.product_price)}</td>
                        <td className="text-right py-2">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <div className="flex justify-between py-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(orderData.total_amount)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Ongkir:</span>
                  <span>{orderData.shipping_cost === 0 ? 'GRATIS' : formatCurrency(orderData.shipping_cost)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg border-t">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(orderData.final_amount)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p>Terima kasih telah berbelanja di BOSS STORE</p>
                <p>www.bosstore.com | 0812-3456-7890</p>
                <p className="mt-2">Struk ini sah sebagai bukti pembayaran</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            font-size: 12px;
            background: white;
            color: black;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          a {
            color: black !important;
            text-decoration: none !important;
          }
          
          button, .no-print {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
        }
        
        @page {
          margin: 20px;
          size: auto;
        }
      `}</style>
    </div>
  );
}