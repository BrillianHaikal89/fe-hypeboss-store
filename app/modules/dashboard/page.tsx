'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Star,
  Clock,
  Plus,
  Eye,
  AlertCircle,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from 'lucide-react'
import { useAuthStore } from '../../store/auth-store'

// Data dummy produk
const products = [
  {
    id: 1,
    name: 'Smartphone Pro',
    price: 2499000,
    stock: 45,
    sold: 128,
    rating: 4.8,
    category: 'Elektronik'
  },
  {
    id: 2,
    name: 'Headphone Wireless',
    price: 599000,
    stock: 23,
    sold: 89,
    rating: 4.5,
    category: 'Aksesoris'
  },
  {
    id: 3,
    name: 'Smart Watch',
    price: 1299000,
    stock: 15,
    sold: 42,
    rating: 4.3,
    category: 'Wearable'
  },
  {
    id: 4,
    name: 'Laptop Gaming',
    price: 14999000,
    stock: 8,
    sold: 12,
    rating: 4.9,
    category: 'Elektronik'
  },
  {
    id: 5,
    name: 'Mouse Gaming',
    price: 349000,
    stock: 67,
    sold: 156,
    rating: 4.6,
    category: 'Aksesoris'
  },
  {
    id: 6,
    name: 'Keyboard Mechanical',
    price: 899000,
    stock: 32,
    sold: 78,
    rating: 4.7,
    category: 'Aksesoris'
  },
  {
    id: 7,
    name: 'Monitor 4K',
    price: 5499000,
    stock: 12,
    sold: 24,
    rating: 4.8,
    category: 'Elektronik'
  },
  {
    id: 8,
    name: 'Power Bank',
    price: 299000,
    stock: 89,
    sold: 234,
    rating: 4.4,
    category: 'Aksesoris'
  }
]

// Data statistik
const stats = [
  {
    label: 'Total Produk',
    value: '24',
    icon: Package,
    change: '+2',
    trend: 'up',
    color: 'bg-blue-500'
  },
  {
    label: 'Pesanan Hari Ini',
    value: '8',
    icon: ShoppingCart,
    change: '+15%',
    trend: 'up',
    color: 'bg-green-500'
  },
  {
    label: 'Pendapatan Bulan Ini',
    value: 'Rp 12.5 JT',
    icon: DollarSign,
    change: '+23%',
    trend: 'up',
    color: 'bg-purple-500'
  },
  {
    label: 'Pelanggan Baru',
    value: '42',
    icon: Users,
    change: '+8',
    trend: 'up',
    color: 'bg-orange-500'
  }
]

export default function DashboardPage () {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto'></div>
          <p className='mt-4 text-gray-600'>Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Main Content */}
      <main className='pt-16 md:pt-20'>
        {' '}
        {/* Menambahkan padding-top untuk menghindari navbar */}
        <div className='px-4 md:px-6 lg:px-8 py-4 md:py-6'>
          {/* Welcome Banner */}
          <div className='mb-6 md:mb-8'>
            <div className='bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl lg:rounded-2xl p-5 md:p-6 lg:p-8 text-white'>
              <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6'>
                <div className='flex-1'>
                  <h1 className='text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3'>
                    Selamat datang kembali, {user.full_name}! 👋
                  </h1>
                  <p className='text-green-100 text-sm md:text-base'>
                    Kelola dan pantau penjualan produk Anda di satu tempat
                  </p>
                </div>
                <button
                  onClick={() => router.push('/modules/categories')}
                  className='flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md w-full lg:w-auto min-w-[180px]'
                >
                  <Plus className='w-4 h-4 md:w-5 md:h-5' />
                  <span className='text-sm md:text-base'>
                    Tambah Kategori Baru
                  </span>
                </button>
                <button
                  onClick={() => router.push('/modules/products')}
                  className='flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md w-full lg:w-auto min-w-[180px]'
                >
                  <Plus className='w-4 h-4 md:w-5 md:h-5' />
                  <span className='text-sm md:text-base'>Kelola Produk</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8'>
            {stats.map((stat, index) => (
              <div
                key={index}
                className='bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4 md:p-5'
              >
                <div className='flex items-center justify-between'>
                  <div className='space-y-1 md:space-y-2'>
                    <p className='text-xs md:text-sm text-gray-500'>
                      {stat.label}
                    </p>
                    <p className='text-lg md:text-xl lg:text-2xl font-bold text-gray-800'>
                      {stat.value}
                    </p>
                    <div className='flex items-center mt-1'>
                      {stat.trend === 'up' ? (
                        <TrendingUpIcon className='w-3 h-3 md:w-4 md:h-4 text-green-500 mr-1 md:mr-2' />
                      ) : (
                        <TrendingDownIcon className='w-3 h-3 md:w-4 md:h-4 text-red-500 mr-1 md:mr-2' />
                      )}
                      <span
                        className={`text-xs md:text-sm font-medium ${
                          stat.trend === 'up'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className='text-gray-500 text-xs ml-1 md:ml-2 hidden lg:inline'>
                        dari kemarin
                      </span>
                    </div>
                  </div>
                  <div
                    className={`${stat.color} w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shadow-sm`}
                  >
                    <stat.icon className='w-5 h-5 md:w-6 md:h-6 text-white' />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Products Section */}
          <div className='bg-white rounded-xl shadow-sm mb-6 md:mb-8 overflow-hidden'>
            <div className='px-4 md:px-6 py-4 md:py-5 border-b border-gray-100'>
              <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-4'>
                <div className='space-y-1'>
                  <h2 className='text-lg md:text-xl lg:text-2xl font-bold text-gray-800'>
                    Produk Terlaris
                  </h2>
                  <p className='text-gray-500 text-xs md:text-sm'>
                    Produk dengan penjualan tertinggi bulan ini
                  </p>
                </div>
                <button className='flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium text-sm md:text-base transition-colors'>
                  <span>Lihat Semua</span>
                  <Eye className='w-4 h-4 md:w-5 md:h-5' />
                </button>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left p-3 md:p-4 font-semibold text-gray-700 text-xs md:text-sm min-w-[200px]'>
                      Produk
                    </th>
                    <th className='text-left p-3 md:p-4 font-semibold text-gray-700 text-xs md:text-sm min-w-[120px]'>
                      Kategori
                    </th>
                    <th className='text-left p-3 md:p-4 font-semibold text-gray-700 text-xs md:text-sm min-w-[140px]'>
                      Harga
                    </th>
                    <th className='text-left p-3 md:p-4 font-semibold text-gray-700 text-xs md:text-sm min-w-[100px]'>
                      Stok
                    </th>
                    <th className='text-left p-3 md:p-4 font-semibold text-gray-700 text-xs md:text-sm min-w-[120px]'>
                      Terjual
                    </th>
                    <th className='text-left p-3 md:p-4 font-semibold text-gray-700 text-xs md:text-sm min-w-[120px]'>
                      Rating
                    </th>
                    <th className='text-left p-3 md:p-4 font-semibold text-gray-700 text-xs md:text-sm min-w-[60px]'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {products.map(product => (
                    <tr
                      key={product.id}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <td className='p-3 md:p-4'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                            <Package className='w-4 h-4 md:w-5 md:h-5 text-gray-600' />
                          </div>
                          <div>
                            <p className='font-medium text-gray-800 text-sm md:text-base'>
                              {product.name}
                            </p>
                            <p className='text-gray-500 text-xs md:text-sm'>
                              ID: PROD{product.id.toString().padStart(3, '0')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='p-3 md:p-4'>
                        <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs md:text-sm font-medium bg-gray-100 text-gray-800'>
                          {product.category}
                        </span>
                      </td>
                      <td className='p-3 md:p-4'>
                        <div className='font-semibold text-gray-800 text-sm md:text-base'>
                          {formatRupiah(product.price)}
                        </div>
                      </td>
                      <td className='p-3 md:p-4'>
                        <div className='flex items-center space-x-1'>
                          <span className='font-semibold text-gray-800 text-sm md:text-base'>
                            {product.stock}
                          </span>
                          <span className='text-gray-500 text-xs'>unit</span>
                        </div>
                      </td>
                      <td className='p-3 md:p-4'>
                        <div className='flex items-center space-x-1'>
                          <span className='font-semibold text-gray-800 text-sm md:text-base'>
                            {product.sold}
                          </span>
                          <span className='text-gray-500 text-xs'>terjual</span>
                        </div>
                      </td>
                      <td className='p-3 md:p-4'>
                        <div className='flex items-center space-x-2'>
                          <div className='flex items-center'>
                            <Star className='w-4 h-4 text-yellow-500 fill-current' />
                            <span className='ml-1 font-semibold text-gray-800 text-sm md:text-base'>
                              {product.rating}
                            </span>
                          </div>
                          <span className='text-gray-500 text-xs md:text-sm'>
                            /5.0
                          </span>
                        </div>
                      </td>
                      <td className='p-3 md:p-4'>
                        <button className='p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors'>
                          <MoreVertical className='w-4 h-4 md:w-5 md:h-5 text-gray-500' />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Section */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6'>
            {/* Recent Orders */}
            <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
              <div className='px-4 md:px-6 py-4 md:py-5 border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <h3 className='text-base md:text-lg font-bold text-gray-800'>
                      Pesanan Terbaru
                    </h3>
                    <p className='text-gray-500 text-xs md:text-sm'>
                      Pesanan yang baru masuk
                    </p>
                  </div>
                  <div className='p-2 bg-blue-50 rounded-lg'>
                    <Clock className='w-4 h-4 md:w-5 md:h-5 text-blue-500' />
                  </div>
                </div>
              </div>
              <div className='p-2'>
                {[
                  {
                    id: 'ORD-001',
                    customer: 'John Doe',
                    amount: 2499000,
                    status: 'diproses'
                  },
                  {
                    id: 'ORD-002',
                    customer: 'Jane Smith',
                    amount: 899000,
                    status: 'dikirim'
                  },
                  {
                    id: 'ORD-003',
                    customer: 'Bob Johnson',
                    amount: 5499000,
                    status: 'selesai'
                  },
                  {
                    id: 'ORD-004',
                    customer: 'Alice Brown',
                    amount: 299000,
                    status: 'pending'
                  },
                  {
                    id: 'ORD-005',
                    customer: 'Michael Lee',
                    amount: 1299000,
                    status: 'dikirim'
                  }
                ].map(order => (
                  <div
                    key={order.id}
                    className='flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
                  >
                    <div className='space-y-1'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center'>
                          <ShoppingCart className='w-3 h-3 md:w-4 md:h-4 text-gray-600' />
                        </div>
                        <div>
                          <p className='font-medium text-gray-800 text-sm md:text-base'>
                            {order.id}
                          </p>
                          <p className='text-gray-500 text-xs md:text-sm'>
                            {order.customer}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='text-right space-y-1'>
                      <p className='font-bold text-gray-800 text-base md:text-lg'>
                        {formatRupiah(order.amount)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.status === 'selesai'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'dikirim'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'diproses'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Alert */}
            <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
              <div className='px-4 md:px-6 py-4 md:py-5 border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <h3 className='text-base md:text-lg font-bold text-gray-800'>
                      Peringatan Stok
                    </h3>
                    <p className='text-gray-500 text-xs md:text-sm'>
                      Produk dengan stok rendah
                    </p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <div className='px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs md:text-sm font-medium'>
                      4 produk
                    </div>
                    <div className='p-2 bg-red-50 rounded-lg'>
                      <AlertCircle className='w-4 h-4 md:w-5 md:h-5 text-red-500' />
                    </div>
                  </div>
                </div>
              </div>
              <div className='p-2'>
                {products
                  .filter(p => p.stock < 20)
                  .map(product => (
                    <div
                      key={product.id}
                      className='flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
                    >
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 md:w-10 md:h-10 bg-red-50 rounded-lg flex items-center justify-center'>
                          <Package className='w-4 h-4 md:w-5 md:h-5 text-red-500' />
                        </div>
                        <div className='space-y-1'>
                          <p className='font-medium text-gray-800 text-sm md:text-base'>
                            {product.name}
                          </p>
                          <div className='flex items-center space-x-2'>
                            <span className='text-gray-500 text-xs md:text-sm'>
                              {product.category}
                            </span>
                            <span className='text-gray-300'>•</span>
                            <span className='text-gray-500 text-xs md:text-sm'>
                              ID: PROD{product.id.toString().padStart(3, '0')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='flex items-center justify-end space-x-2'>
                          <div className='text-right'>
                            <p className='font-bold text-red-600 text-base md:text-lg'>
                              {product.stock} unit
                            </p>
                            <p className='text-gray-500 text-xs'>tersisa</p>
                          </div>
                          <div
                            className={`p-1.5 md:p-2 rounded-lg ${
                              product.stock < 10 ? 'bg-red-50' : 'bg-yellow-50'
                            }`}
                          >
                            {product.stock < 10 ? (
                              <AlertCircle className='w-4 h-4 md:w-5 md:h-5 text-red-500' />
                            ) : (
                              <AlertCircle className='w-4 h-4 md:w-5 md:h-5 text-yellow-500' />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Footer Space */}
          <div className='h-6 md:h-8'></div>
        </div>
      </main>
    </div>
  )
}
