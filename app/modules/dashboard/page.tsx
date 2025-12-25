// app/modules/dashboard/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import {
  Package,
  ShoppingCart,
  DollarSign,
  ClipboardList,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Plus,
  Eye,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../../store/auth-store'
import DashboardCustomer from './components/dashboardCustomer'

// Types untuk produk dan kategori
interface Product {
  id: number
  name: string
  description: string
  category_id: number
  price: string
  discount_price: string | null
  stock: number
  image: string
  is_featured: boolean
  is_active: boolean
  created_at: string
  category_name: string
}

interface Category {
  id: number
  name: string
  description: string
  image: string
  is_active: boolean
  created_at: string
}

// Data statistik untuk admin
const getInitialStats = () => [
  {
    label: 'Total Produk',
    value: '0',
    icon: Package,
    change: '+0',
    trend: 'up' as const,
    color: 'bg-blue-500'
  },
  {
    label: 'Total Kategori',
    value: '0',
    icon: ShoppingCart,
    change: '+0',
    trend: 'up' as const,
    color: 'bg-green-500'
  },
  {
    label: 'Pendapatan Bulan Ini',
    value: 'Rp 0',
    icon: DollarSign,
    change: '+0%',
    trend: 'up' as const,
    color: 'bg-purple-500'
  },
  {
    label: 'Pesanan',
    value: '0',
    icon: ClipboardList,
    change: '+0',
    trend: 'up' as const,
    color: 'bg-orange-500'
  }
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState(getInitialStats)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Gunakan useMemo untuk lowStockProducts
  const lowStockProducts = useMemo(() => {
    return products.filter(product => product.stock < 20)
  }, [products])

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      if (!user || isLoading) return
      
      try {
        setIsLoadingData(true)
        
        // Fetch produk aktif
        const productsResponse = await fetch('http://localhost:3001/api/products')
        const productsData = await productsResponse.json()
        
        if (productsData.success) {
          setProducts(productsData.data)
        }

        // Fetch kategori aktif
        const categoriesResponse = await fetch('http://localhost:3001/api/categories')
        const categoriesData = await categoriesResponse.json()
        
        if (categoriesData.success) {
          setCategories(categoriesData.data)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [user, isLoading])

  // Update statistik untuk admin
  useEffect(() => {
    if (!isLoadingData && user?.role === 'admin') {
      setStats(prev => prev.map(stat => {
        if (stat.label === 'Total Produk') {
          return { ...stat, value: products.length.toString() }
        }
        if (stat.label === 'Total Kategori') {
          return { ...stat, value: categories.length.toString() }
        }
        return stat
      }))
    }
  }, [products, categories, isLoadingData, user])

  // Redirect jika tidak login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading || isLoadingData) {
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

  // Dashboard untuk Customer
  if (user.role === 'customer') {
    return (
      <DashboardCustomer 
        products={products}
        categories={categories}
        isLoadingData={isLoadingData}
      />
    )
  }

  // Dashboard untuk Admin
  return (
    <div className='min-h-screen bg-gray-50'>
      <main className='pt-16 md:pt-20'>
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
                    Produk Terbaru
                  </h2>
                  <p className='text-gray-500 text-xs md:text-sm'>
                    Produk yang baru ditambahkan
                  </p>
                </div>
                <button 
                  onClick={() => router.push('/modules/products')}
                  className='flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium text-sm md:text-base transition-colors'
                >
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
                      Status
                    </th>
                    <th className='text-left p-3 md:p-4 font-semibold text-gray-700 text-xs md:text-sm min-w-[60px]'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {products.slice(0, 5).map(product => (
                    <tr
                      key={product.id}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <td className='p-3 md:p-4'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden'>
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
                              }}
                            />
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
                          {product.category_name}
                        </span>
                      </td>
                      <td className='p-3 md:p-4'>
                        <div className='font-semibold text-gray-800 text-sm md:text-base'>
                          {formatRupiah(parseFloat(product.price))}
                        </div>
                        {product.discount_price && (
                          <div className='text-sm text-red-500 line-through'>
                            {formatRupiah(parseFloat(product.discount_price))}
                          </div>
                        )}
                      </td>
                      <td className='p-3 md:p-4'>
                        <div className='flex items-center space-x-1'>
                          <span className={`font-semibold text-sm md:text-base ${
                            product.stock < 10 ? 'text-red-600' : 
                            product.stock < 20 ? 'text-yellow-600' : 
                            'text-gray-800'
                          }`}>
                            {product.stock}
                          </span>
                          <span className='text-gray-500 text-xs'>unit</span>
                        </div>
                      </td>
                      <td className='p-3 md:p-4'>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className='p-3 md:p-4'>
                        <button 
                          onClick={() => router.push(`/modules/products/edit/${product.id}`)}
                          className='p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors'
                        >
                          <Eye className='w-4 h-4 md:w-5 md:h-5 text-gray-500' />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && !isLoadingData && (
                    <tr>
                      <td colSpan={6} className='p-6 text-center text-gray-500'>
                        Tidak ada produk tersedia
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Section */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6'>
            {/* Categories Overview */}
            <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
              <div className='px-4 md:px-6 py-4 md:py-5 border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <h3 className='text-base md:text-lg font-bold text-gray-800'>
                      Kategori Produk
                    </h3>
                    <p className='text-gray-500 text-xs md:text-sm'>
                      Daftar kategori yang tersedia
                    </p>
                  </div>
                  <div className='p-2 bg-blue-50 rounded-lg'>
                    <Package className='w-4 h-4 md:w-5 md:h-5 text-blue-500' />
                  </div>
                </div>
              </div>
              <div className='p-2'>
                {categories.slice(0, 5).map(category => (
                  <div
                    key={category.id}
                    className='flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
                    onClick={() => router.push(`/modules/categories/edit/${category.id}`)}
                  >
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden'>
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className='w-full h-full object-cover'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
                          }}
                        />
                      </div>
                      <div className='space-y-1'>
                        <p className='font-medium text-gray-800 text-sm md:text-base'>
                          {category.name}
                        </p>
                        <p className='text-gray-500 text-xs md:text-sm truncate max-w-[150px]'>
                          {category.description || 'Tidak ada deskripsi'}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && !isLoadingData && (
                  <div className='text-center py-6 text-gray-500'>
                    Tidak ada kategori tersedia
                  </div>
                )}
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
                      {lowStockProducts.length} produk
                    </div>
                    <div className='p-2 bg-red-50 rounded-lg'>
                      <AlertCircle className='w-4 h-4 md:w-5 md:h-5 text-red-500' />
                    </div>
                  </div>
                </div>
              </div>
              <div className='p-2'>
                {lowStockProducts.slice(0, 5).map(product => (
                  <div
                    key={product.id}
                    className='flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
                    onClick={() => router.push(`/modules/products/edit/${product.id}`)}
                  >
                    <div className='flex items-center space-x-3'>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center overflow-hidden ${
                        product.stock < 10 ? 'bg-red-50' : 'bg-yellow-50'
                      }`}>
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className='w-full h-full object-cover'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                          }}
                        />
                      </div>
                      <div className='space-y-1'>
                        <p className='font-medium text-gray-800 text-sm md:text-base'>
                          {product.name}
                        </p>
                        <div className='flex items-center space-x-2'>
                          <span className='text-gray-500 text-xs md:text-sm'>
                            {product.category_name}
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
                          <p className={`font-bold text-base md:text-lg ${
                            product.stock < 10 ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {product.stock} unit
                          </p>
                          <p className='text-gray-500 text-xs'>tersisa</p>
                        </div>
                        <div
                          className={`p-1.5 md:p-2 rounded-lg ${
                            product.stock < 10 ? 'bg-red-50' : 'bg-yellow-50'
                          }`}
                        >
                          <AlertCircle className={`w-4 h-4 md:w-5 md:h-5 ${
                            product.stock < 10 ? 'text-red-500' : 'text-yellow-500'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length === 0 && !isLoadingData && (
                  <div className='text-center py-6 text-gray-500'>
                    Semua stok produk aman
                  </div>
                )}
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