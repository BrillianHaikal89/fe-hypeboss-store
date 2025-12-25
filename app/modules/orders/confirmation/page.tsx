// app/modules/orders/confirmation/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Package, 
  Home, 
  ShoppingBag, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CreditCard,
  MessageSquare,
  Printer,
  ArrowLeft,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth-store';

interface OrderItem {
  id: number;
  product_name: string;
  product_price: number;
  original_price: number;
  quantity: number;
  subtotal: number;
  product_image: string;
}

interface OrderData {
  id: number;
  order_code: string;
  total_amount: number;
  shipping_cost: number;
  final_amount: number;
  shipping_address: string;
  shipping_phone: string;
  notes: string;
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'challenge' | 'expired';
  payment_method: string;
  created_at: string;
  items: OrderItem[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, token } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'error' | null>(null);
  const [copied, setCopied] = useState(false);
  
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');

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
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
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
        
        // Set payment status based on order data
        if (result.data.payment_status === 'paid') {
          setPaymentStatus('success');
        } else if (result.data.payment_status === 'pending') {
          setPaymentStatus('pending');
        } else {
          setPaymentStatus('error');
        }
      } else {
        throw new Error(result.message || "Gagal mengambil data pesanan");
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || "Gagal mengambil data pesanan");
    } finally {
      setIsLoading(false);
    }
  }, [token, orderId]);

  useEffect(() => {
    if (orderId && token && isAuthenticated()) {
      fetchOrderData();
    } else {
      setIsLoading(false);
    }
  }, [orderId, token, isAuthenticated, fetchOrderData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
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
      return 'Tanggal tidak valid';
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

  // Copy order code to clipboard
  const copyOrderCode = () => {
    if (orderData?.order_code) {
      navigator.clipboard.writeText(orderData.order_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Handle send receipt via WhatsApp
  const handleSendReceipt = async () => {
    if (!orderId || !token) return;
    
    try {
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
          alert('Struk telah dikirim via WhatsApp!');
        }
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      alert('Gagal mengirim struk via WhatsApp');
    }
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending': return 'Menunggu Pembayaran';
      case 'processing': return 'Diproses';
      case 'shipped': return 'Dalam Pengiriman';
      case 'delivered': return 'Sampai Tujuan';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'shipped': return 'text-indigo-600 bg-indigo-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat konfirmasi pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/modules/dashboard?tab=orders" 
              className="flex items-center gap-2 text-gray-600 hover:text-green-600"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Kembali</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Konfirmasi Pesanan</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Status Banner */}
        <div className="mb-6">
          {paymentStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil</h1>
              <p className="text-gray-600 mb-4">
                Terima kasih telah berbelanja. Pesanan Anda akan segera diproses.
              </p>
              {orderData?.order_code && (
                <div className="inline-block bg-white px-4 py-2 rounded border">
                  <p className="text-sm text-gray-500">Kode Pesanan</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-green-600">{orderData.order_code}</p>
                    <button
                      onClick={copyOrderCode}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Salin kode"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentStatus === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Menunggu Pembayaran</h1>
              <p className="text-gray-600 mb-4">
                Silakan selesaikan pembayaran Anda.
              </p>
              {orderData && (
                <div>
                  <div className="inline-block bg-white px-4 py-2 rounded border mb-4">
                    <p className="text-sm text-gray-500">Kode Pesanan</p>
                    <p className="font-mono font-bold text-green-600">{orderData.order_code}</p>
                  </div>
                  <div>
                    <Link
                      href={`/modules/orders?order_id=${orderData.id}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded hover:bg-green-700"
                    >
                      <CreditCard className="w-5 h-5" />
                      Lanjutkan Pembayaran
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Gagal</h1>
              <p className="text-gray-600 mb-4">
                Terjadi kesalahan saat proses pembayaran.
              </p>
              {orderData && (
                <div>
                  <div className="inline-block bg-white px-4 py-2 rounded border mb-4">
                    <p className="text-sm text-gray-500">Kode Pesanan</p>
                    <p className="font-mono font-bold text-green-600">{orderData.order_code}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Link
                      href={`/modules/orders?order_id=${orderData.id}`}
                      className="px-6 py-3 bg-green-600 text-white font-medium rounded hover:bg-green-700"
                    >
                      Coba Bayar Lagi
                    </Link>
                    <button className="px-6 py-3 border border-red-300 text-red-600 font-medium rounded hover:bg-red-50">
                      Hubungi CS
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/modules/dashboard?tab=orders"
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded hover:bg-green-700"
                >
                  Kembali ke Dashboard
                </Link>
                <button
                  onClick={() => fetchOrderData()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {orderData && (
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-bold text-gray-900 mb-3">Status Pesanan</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status Pesanan</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderData.order_status)}`}>
                    {getStatusDisplay(orderData.order_status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status Pembayaran</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(orderData.payment_status)}`}>
                    {orderData.payment_status === 'paid' && 'Lunas'}
                    {orderData.payment_status === 'pending' && 'Menunggu'}
                    {orderData.payment_status === 'failed' && 'Gagal'}
                    {orderData.payment_status === 'refunded' && 'Dikembalikan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h2 className="font-bold text-gray-900">Produk Dipesan</h2>
              </div>
              <div className="divide-y">
                {orderData.items.map((item, index) => (
                  <div key={index} className="p-4">
                    <div className="flex gap-4">
                      {item.product_image ? (
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {item.product_name}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">
                            {formatCurrency(item.product_price)}
                          </span>
                          {item.original_price > item.product_price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(item.original_price)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm text-gray-600">
                            Jumlah: {item.quantity}
                          </p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-bold text-gray-900 mb-3">Informasi Pengiriman</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Alamat</p>
                    <p className="text-gray-600">{orderData.shipping_address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Telepon</p>
                    <p className="text-gray-600">{orderData.shipping_phone}</p>
                  </div>
                </div>
                {orderData.notes && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Catatan</p>
                      <p className="text-gray-600">{orderData.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-bold text-gray-900 mb-4">Ringkasan Pembayaran</h3>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Harga</span>
                  <span className="text-gray-900">{formatCurrency(calculateTotalOriginalPrice())}</span>
                </div>
                
                {calculateTotalDiscount() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diskon</span>
                    <span className="text-red-600">- {formatCurrency(calculateTotalDiscount())}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(orderData.total_amount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Ongkir</span>
                  <span className={orderData.shipping_cost === 0 ? 'text-green-600' : 'text-gray-900'}>
                    {orderData.shipping_cost === 0 ? 'Gratis' : formatCurrency(orderData.shipping_cost)}
                  </span>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-green-600 text-lg">
                      {formatCurrency(orderData.final_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="text-gray-900">{formatDate(orderData.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Pembayaran:</span>
                    <span className="text-gray-900 capitalize">
                      {orderData.payment_method?.replace('_', ' ') || 'Transfer Bank'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-bold text-gray-900 mb-4">Aksi</h3>
              <div className="space-y-3">
                <button
                  onClick={handlePrintReceipt}
                  className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Cetak Struk
                </button>
                
                <button
                  onClick={handleSendReceipt}
                  className="w-full py-3 bg-green-600 text-white font-medium rounded hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Kirim via WhatsApp
                </button>
                
                <Link
                  href="/"
                  className="w-full py-3 border border-gray-700 text-gray-700 font-medium rounded hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Lanjutkan Belanja
                </Link>
              </div>
            </div>

            {/* Customer Support */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Butuh Bantuan?</p>
                  <p className="text-sm text-gray-600">Hubungi customer service</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span>+62 812 3456 7890</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span>support@toko.com</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!orderData && !error && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">
              Tidak ada data pesanan yang dapat ditampilkan.
            </p>
            <div className="space-y-3">
              <Link
                href="/modules/dashboard?tab=orders"
                className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded hover:bg-green-700"
              >
                Lihat Pesanan Saya
              </Link>
              <Link
                href="/"
                className="inline-block px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50"
              >
                Kembali Berbelanja
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section,
          .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}