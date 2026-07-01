'use client'

import { ReactElement } from 'react'
import { X, Download, MapPin, Phone, CreditCard } from 'lucide-react'

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  product_price: string
  quantity: number
  subtotal: string
  created_at: string
  product_image: string
  original_price: number
  discount_value: string
  product_original_price: string
  discount_per_item: string
  discount_price: number
}

interface OrderSummary {
  total_items: number
  total_original_price: number
  total_discount: number
}

interface Order {
  id: number
  order_code: string
  user_id: number
  total_amount: string
  shipping_cost: string
  final_amount: string
  shipping_address: string
  shipping_phone: string
  notes: string | null
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'expired'
  payment_method: 'bank_transfer' | 'credit_card' | 'e_wallet'
  payment_proof: string | null
  created_at: string
  updated_at: string
  midtrans_transaction_id: string | null
  payment_type: string | null
  total_count: string
  items: OrderItem[]
  summary: OrderSummary
}

interface PopupDetailProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => ReactElement
  getStatusText: (status: string) => string
  formatRupiah: (amount: string | number) => string
  formatDate: (dateString: string) => string
  onDownloadInvoice: (order: Order) => void
}

export default function PopupDetail({
  order,
  isOpen,
  onClose,
  getStatusColor,
  getStatusIcon,
  getStatusText,
  formatRupiah,
  formatDate,
  onDownloadInvoice
}: PopupDetailProps) {
  if (!isOpen || !order) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Detail Pesanan #{order.order_code}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Status Pesanan</h3>
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusColor(order.order_status)}`}>
                    {getStatusIcon(order.order_status)}
                    <span className="font-medium">{getStatusText(order.order_status)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Informasi Pembayaran</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metode Pembayaran</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {order.payment_method.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status Pembayaran</span>
                      <span className={`font-medium ${
                        order.payment_status === 'paid' 
                          ? 'text-green-600' 
                          : 'text-yellow-600'
                      }`}>
                        {order.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Alamat Pengiriman</h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-900">{order.shipping_address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{order.shipping_phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">Ringkasan Pembayaran</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal Produk</span>
                    <span className="text-gray-900">{formatRupiah(order.total_amount)}</span>
                  </div>
                  {order.summary.total_discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Diskon</span>
                      <span className="text-green-600">-{formatRupiah(order.summary.total_discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Pengiriman</span>
                    <span className="text-gray-900">{formatRupiah(order.shipping_cost)}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-gray-900">Total Pembayaran</span>
                      <span className="text-gray-900">{formatRupiah(order.final_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items in Modal */}
            <div className="mt-8">
              <h3 className="font-medium text-gray-900 mb-4">Produk Dipesan</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 bg-white border rounded-lg border-gray-200">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.product_name}</h4>
                      <div className="text-sm text-gray-600">
                        {item.quantity} x {formatRupiah(item.product_price)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-gray-900">{formatRupiah(item.subtotal)}</p>
                      {item.discount_price > 0 && (
                        <p className="text-sm text-green-600">
                          Hemat {formatRupiah(item.discount_price * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => onDownloadInvoice(order)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Invoice</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}