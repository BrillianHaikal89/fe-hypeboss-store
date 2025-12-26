// app/modules/orders/confirmation/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Home, 
  Phone, 
  MapPin, 
  Calendar,
  CreditCard,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Check,
  Clock,
  User,
  ShoppingBag
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
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
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
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');

  // Authentication check
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      router.replace("/login");
      return;
    }
  }, [isAuthenticated, router]);

  // Fetch order data
  const fetchOrderData = useCallback(async () => {
    if (!token || !orderId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
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
    } catch (err) {
      console.error('Error fetching order:', err);
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

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

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

  const calculateTotalDiscount = () => {
    if (!orderData?.items) return 0;
    return orderData.items.reduce((total, item) => {
      const originalPrice = item.original_price || item.product_price || 0;
      return total + ((originalPrice - item.product_price) * item.quantity);
    }, 0);
  };

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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleWhatsAppSupport = () => {
    if (!orderData) return;
    const message = `Halo admin, saya ingin bertanya tentang pesanan ${orderData.order_code}`;
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Loading state
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
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/modules/dashboard?tab=orders" 
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Kembali</span>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 text-center sm:text-left">
                Konfirmasi Pesanan
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Banner */}
        {(status === 'success' || orderData?.payment_status === 'paid') && (
          <div className="mb-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Pembayaran Berhasil!
            </h1>
            <p className="text-gray-600 mb-4">
              Terima kasih telah berbelanja. Pesanan Anda akan segera diproses.
            </p>
            {orderData?.order_code && (
              <div className="inline-flex items-center gap-3 bg-white px-4 py-3 rounded-lg border shadow-sm">
                <div className="text-left">
                  <p className="text-sm text-gray-500">Kode Pesanan</p>
                  <p className="font-mono font-bold text-green-600 text-lg">
                    {orderData.order_code}
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        {orderData ? (
          <div className="space-y-6">
            {/* Order Status Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status Pesanan</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(orderData.order_status)}`}>
                      {getStatusDisplay(orderData.order_status)}
                    </span>
                    <Truck className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Pembayaran</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      orderData.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {orderData.payment_status === 'paid' ? 'Lunas' : 'Menunggu'}
                    </span>
                    <CreditCard className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>
              
              {/* Items List */}
              <div className="space-y-4 mb-6">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    {item.product_image ? (
                      <img 
                        src={item.product_image} 
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 line-clamp-2">
                        {item.product_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(item.product_price)}
                        </span>
                        {item.original_price > item.product_price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(item.original_price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        {item.quantity} × {formatCurrency(item.product_price)}
                      </div>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t pt-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(orderData.total_amount)}</span>
                </div>
                
                {calculateTotalDiscount() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Diskon</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(calculateTotalDiscount())}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Biaya Pengiriman</span>
                  <span className={`font-medium ${orderData.shipping_cost === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {orderData.shipping_cost === 0 ? 'Gratis' : formatCurrency(orderData.shipping_cost)}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span className="text-gray-900">Total Pembayaran</span>
                  <span className="text-green-600">{formatCurrency(orderData.final_amount)}</span>
                </div>
              </div>
            </div>

            {/* Shipping & Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <h3 className="font-bold text-gray-900">Alamat Pengiriman</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Alamat</p>
                    <p className="text-gray-900">{orderData.shipping_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Nomor Telepon</p>
                    <p className="text-gray-900">{orderData.shipping_phone}</p>
                  </div>
                  {orderData.notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Catatan</p>
                      <p className="text-gray-900">{orderData.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="font-bold text-gray-900">Informasi Pesanan</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tanggal Pesanan</p>
                    <p className="text-gray-900">{formatDate(orderData.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Metode Pembayaran</p>
                    <p className="text-gray-900 capitalize">
                      {orderData.payment_method?.replace('_', ' ') || 'Transfer Bank'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status Pesanan</p>
                    <p className="text-gray-900">{getStatusDisplay(orderData.order_status)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Diperbarui tanpa cetak struk */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-bold text-gray-900 mb-4">Aksi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleWhatsAppSupport}
                  className="flex flex-col items-center justify-center gap-2 py-4 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <MessageSquare className="w-6 h-6" />
                  <span className="text-sm font-medium">Chat WhatsApp</span>
                  <span className="text-xs text-green-100">Dukungan Pelanggan</span>
                </button>
                
                <Link
                  href="/modules/pesananSaya"
                  className="flex flex-col items-center justify-center gap-2 py-4 px-4 border border-gray-700 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <User className="w-6 h-6" />
                  <span className="text-sm font-medium">Lihat Pesanan</span>
                  <span className="text-xs text-gray-500">Riwayat Pesanan</span>
                </Link>
                
                <Link
                  href="/"
                  className="flex flex-col items-center justify-center gap-2 py-4 px-4 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                  <ShoppingBag className="w-6 h-6" />
                  <span className="text-sm font-medium">Lanjut Belanja</span>
                  <span className="text-xs text-gray-300">Temukan Produk Lain</span>
                </Link>
              </div>
            </div>

            {/* Support Info */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>Butuh bantuan? Hubungi Customer Service: 0812-3456-7890</span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Pesanan Tidak Ditemukan
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Tidak ada data pesanan yang dapat ditampilkan. 
              Pastikan Anda memiliki pesanan yang valid.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/modules/pesananSaya"
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Lihat Pesanan Saya
              </Link>
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Kembali Berbelanja
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}