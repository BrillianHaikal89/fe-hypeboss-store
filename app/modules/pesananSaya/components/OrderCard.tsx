'use client'

import { ReactElement } from 'react'
import { ChevronRight, Eye, Download, CreditCard, MapPin } from 'lucide-react'
import { Order } from '../types/order'

interface OrderCardProps {
  order: Order
  onViewDetail: (order: Order) => void
  onDownloadInvoice: (order: Order) => void
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => ReactElement
  getStatusText: (status: string) => string
  formatRupiah: (amount: string | number) => string
  formatDate: (dateString: string) => string
}

export default function OrderCard({
  order,
  onViewDetail,
  onDownloadInvoice,
  getStatusColor,
  getStatusIcon,
  getStatusText,
  formatRupiah,
  formatDate
}: OrderCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      {/* Order Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
              <span className="font-medium text-gray-900 truncate">
                #{order.order_code}
              </span>
              <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.order_status)}`}>
                {getStatusIcon(order.order_status)}
                <span>{getStatusText(order.order_status)}</span>
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {formatDate(order.created_at)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm text-gray-600 hidden sm:block">Total Belanja</p>
              <p className="text-lg font-bold text-gray-900">
                {formatRupiah(order.final_amount)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {order.items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-1 truncate">
                  {item.product_name}
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600">
                  <span>{item.quantity} x {formatRupiah(item.product_price)}</span>
                  {item.discount_price > 0 && (
                    <span className="text-green-600 font-medium">
                      Diskon: {formatRupiah(item.discount_price)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-medium text-gray-900">
                  {formatRupiah(item.subtotal)}
                </p>
                {item.discount_price > 0 && (
                  <p className="text-sm text-gray-500 line-through hidden sm:block">
                    {formatRupiah(item.original_price * item.quantity)}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {order.items.length > 2 && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                +{order.items.length - 2} produk lainnya
              </p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-600">
              {order.items.length} produk • {order.summary.total_items} item
            </div>
            <div className="text-right">
              {order.summary.total_discount > 0 && (
                <p className="text-sm text-gray-600 mb-1">
                  Total Diskon: <span className="text-green-600 font-medium">
                    -{formatRupiah(order.summary.total_discount)}
                  </span>
                </p>
              )}
              <p className="text-sm text-gray-600">
                Biaya Pengiriman: {formatRupiah(order.shipping_cost)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Actions */}
      <div className="p-4 sm:p-6 border-t bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4 text-sm text-gray-600 overflow-x-auto">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <CreditCard className="w-4 h-4" />
              <span className="text-gray-900 capitalize whitespace-nowrap">
                {order.payment_method.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <MapPin className="w-4 h-4" />
              <span className="text-gray-900 truncate max-w-[150px] sm:max-w-none">
                {order.shipping_address}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 pt-4 md:pt-0">
            <button
              onClick={() => onViewDetail(order)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              <span>Detail</span>
            </button>
            
            <button
              onClick={() => onDownloadInvoice(order)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              <span>Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}