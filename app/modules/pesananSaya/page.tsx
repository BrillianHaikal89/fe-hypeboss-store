'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/auth-store'
import { ArrowLeft, Package, AlertCircle } from 'lucide-react'
import PopupDetail from './components/popupDetail'
import OrderStats from './components/OrderStats'
import OrderFilters from './components/OrderFilters'
import OrderCard from './components/OrderCard'
import { Order, FilterState, OrdersResponse } from './types/order'

export default function PesananSayaPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    date: 'all',
    search: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0
  })

  // Fetch orders data
  useEffect(() => {
    if (token) {
      fetchOrders()
    }
  }, [token])

  // Apply filters when orders or filters change
  useEffect(() => {
    if (orders.length > 0) {
      applyFilters()
    }
  }, [orders, filters])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:3001/api/orders/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Gagal mengambil data pesanan')
      }

      const data: OrdersResponse = await response.json()
      
      if (data.success) {
        setOrders(data.data.orders)
        calculateStats(data.data.orders)
      } else {
        throw new Error('Data pesanan tidak ditemukan')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      console.error('Error fetching orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (ordersList: Order[]) => {
    const statsCount = {
      total: ordersList.length,
      pending: ordersList.filter(o => o.order_status === 'pending').length,
      processing: ordersList.filter(o => o.order_status === 'processing').length,
      shipped: ordersList.filter(o => o.order_status === 'shipped').length,
      delivered: ordersList.filter(o => o.order_status === 'delivered').length
    }
    setStats(statsCount)
  }

  const applyFilters = () => {
    let filtered = [...orders]

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.order_status === filters.status)
    }

    // Filter by date
    if (filters.date !== 'all') {
      const now = new Date()
      if (filters.date === 'today') {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.created_at)
          return orderDate.toDateString() === now.toDateString()
        })
      } else if (filters.date === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(order => new Date(order.created_at) >= oneWeekAgo)
      } else if (filters.date === 'month') {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        filtered = filtered.filter(order => new Date(order.created_at) >= oneMonthAgo)
      }
    }

    // Filter by search
    if (filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(order =>
        order.order_code.toLowerCase().includes(searchLower) ||
        order.items.some(item => 
          item.product_name.toLowerCase().includes(searchLower)
        )
      )
    }

    setFilteredOrders(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'processing': return 'bg-blue-50 text-blue-800 border-blue-200'
      case 'shipped': return 'bg-purple-50 text-purple-800 border-purple-200'
      case 'delivered': return 'bg-green-50 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-50 text-red-800 border-red-200'
      default: return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'processing': return <Package className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Pembayaran'
      case 'processing': return 'Sedang Diproses'
      case 'shipped': return 'Dalam Pengiriman'
      case 'delivered': return 'Selesai'
      case 'cancelled': return 'Dibatalkan'
      default: return status
    }
  }

  const formatRupiah = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleDownloadInvoice = (order: Order) => {
    alert(`Mengunduh invoice untuk order ${order.order_code}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-10">
        <div className="container mx-auto px-4">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Orders Skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="border-t pt-4">
                  <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="container mx-auto px-4">
        {/* Header dengan judul di tengah */}
        <div className="mb-8">
          {/* Tombol kembali di kiri atas */}
          <div className="mb-6">
            <button
              onClick={() => router.replace('/modules/dashboard')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </button>
          </div>

          {/* Judul di tengah */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Pesanan Saya
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Kelola dan lacak pesanan Anda di satu tempat
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <OrderStats stats={stats} />

        {/* Filters */}
        <OrderFilters filters={filters} onFiltersChange={setFilters} />

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={fetchOrders}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tidak ada pesanan ditemukan
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {filters.status !== 'all' || filters.date !== 'all' || filters.search !== ''
                  ? 'Coba ubah filter pencarian Anda'
                  : 'Belum ada pesanan yang dibuat'}
              </p>
              {filters.status !== 'all' || filters.date !== 'all' || filters.search !== '' ? (
                <button
                  onClick={() => setFilters({
                    status: 'all',
                    date: 'all',
                    search: ''
                  })}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                >
                  Reset Filter
                </button>
              ) : (
                <button
                  onClick={() => router.replace('/modules/dashboard')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                >
                  Mulai Belanja
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetail={handleViewDetail}
                onDownloadInvoice={handleDownloadInvoice}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
                formatRupiah={formatRupiah}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <PopupDetail
        order={selectedOrder}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        getStatusText={getStatusText}
        formatRupiah={formatRupiah}
        formatDate={formatDate}
        onDownloadInvoice={handleDownloadInvoice}
      />
    </div>
  )
}

// Tambahkan import yang diperlukan untuk getStatusIcon
import { Clock, CheckCircle, Truck } from 'lucide-react'