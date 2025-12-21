// app/modules/orders/confirmation/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ShoppingBag, Home, ArrowLeft, Package, Clock } from "lucide-react";
import { useAuthStore } from "../../../store/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');

  useEffect(() => {
    if (orderId && token) {
      fetchOrderData(orderId);
    } else {
      setIsLoading(false);
    }
  }, [orderId, token]);

  const fetchOrderData = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOrderData(result.data);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/modules/dashboard" 
              className="flex items-center gap-2 text-black hover:text-emerald-600 transition-colors"
              prefetch={false}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Kembali ke Dashboard</span>
            </Link>
            
            <Link
              href="/"
              className="flex items-center gap-2 text-black hover:text-emerald-600 transition-colors"
              prefetch={false}
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {status === 'success' ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Pembayaran Berhasil!</h1>
              <p className="text-emerald-100">Terima kasih telah berbelanja di toko kami</p>
            </div>

            {/* Order Details */}
            <div className="p-6 md:p-8">
              {orderData && (
                <>
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-black mb-4">Detail Pesanan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Kode Pesanan</p>
                        <p className="font-bold text-emerald-600 text-lg">{orderData.order_code}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Pembayaran</p>
                        <p className="font-bold text-black text-lg">{formatCurrency(orderData.final_amount)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Status Pesanan</p>
                        <p className="font-bold capitalize text-black">{orderData.order_status}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Metode Pembayaran</p>
                        <p className="font-bold capitalize text-black">{orderData.payment_method?.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-black mb-4">Items dalam Pesanan</h3>
                    <div className="space-y-3">
                      {orderData.items?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-3">
                            {item.product_image && (
                              <img 
                                src={item.product_image} 
                                alt={item.product_name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <p className="font-medium text-black">{item.product_name}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-black">{formatCurrency(item.subtotal)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Next Steps */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-black mb-4">Apa Selanjutnya?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-black">Pesanan Diproses</p>
                      <p className="text-sm text-gray-600">Pesanan Anda akan segera dikemas dan dikirim</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-black">Estimasi Pengiriman</p>
                      <p className="text-sm text-gray-600">2-3 hari kerja untuk pengiriman reguler</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/modules/dashboard?tab=orders&order_id=${orderData?.id}`}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 flex-1"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Lihat Detail Pesanan
                </Link>
                <Link
                  href="/modules/products"
                  className="px-6 py-3 border border-emerald-500 text-emerald-600 font-medium rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 flex-1"
                >
                  Lanjutkan Belanja
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-3">Pembayaran Gagal</h1>
            <p className="text-gray-600 mb-8">
              Maaf, terjadi kesalahan saat memproses pembayaran Anda. Silakan coba lagi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/modules/carts"
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali ke Keranjang
              </Link>
              <Link
                href="/modules/dashboard?tab=orders"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                Lihat Pesanan Saya
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}