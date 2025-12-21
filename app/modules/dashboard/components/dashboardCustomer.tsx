// app/modules/dashboard/components/dashboardCustomer.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import {
  Package,
  ShoppingCart,
  ShoppingBag,
  Heart,
  Search,
  Filter,
  Star,
  X,
  Plus,
  Minus
} from 'lucide-react'
import { useAuthStore } from '../../../store/auth-store'
import { toast } from 'react-hot-toast'

// Types untuk produk dan kategori
interface Product {
  id: number
  name: string
  description: string
  category_id: number
  price: string // harga asli
  discount_price: string | null // jumlah diskon (misalnya 5000), bukan harga setelah diskon
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

interface DashboardCustomerProps {
  products: Product[]
  categories: Category[]
  isLoadingData: boolean
}

export default function DashboardCustomer ({
  products,
  categories,
  isLoadingData
}: DashboardCustomerProps) {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  
  // State untuk popup
  const [showAddToCartModal, setShowAddToCartModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Filter produk berdasarkan kategori dan pencarian
  useMemo(() => {
    let filtered = products

    if (selectedCategory) {
      filtered = filtered.filter(
        product => product.category_id === selectedCategory
      )
    }

    if (searchQuery) {
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          product.category_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [products, selectedCategory, searchQuery])

  // Fetch cart count saat component mount
  useEffect(() => {
    if (user && token) {
      fetchCartCount()
    }
  }, [user, token])

  // Fungsi untuk mendapatkan jumlah item di keranjang
  const fetchCartCount = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/carts/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setCartCount(data.data.total_quantity || 0)
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  // Fungsi untuk membuka popup tambah ke keranjang
  const openAddToCartModal = (product: Product) => {
    if (!user || user.role !== 'customer') {
      toast.error('Silakan login sebagai customer terlebih dahulu')
      router.push('/login')
      return
    }

    if (product.stock === 0) {
      toast.error('Maaf, produk ini sedang habis')
      return
    }

    setSelectedProduct(product)
    setQuantity(1) // Reset quantity ke 1 setiap kali modal dibuka
    setShowAddToCartModal(true)
  }

  // Fungsi untuk menutup popup
  const closeAddToCartModal = () => {
    setShowAddToCartModal(false)
    setSelectedProduct(null)
    setQuantity(1)
    setIsAddingToCart(false)
  }

  // Fungsi untuk mengubah quantity
  const handleQuantityChange = (action: 'increase' | 'decrease' | 'set', value?: number) => {
    if (!selectedProduct) return

    if (action === 'increase') {
      if (quantity < selectedProduct.stock) {
        setQuantity(prev => prev + 1)
      } else {
        toast.error(`Stok maksimal: ${selectedProduct.stock}`)
      }
    } else if (action === 'decrease') {
      if (quantity > 1) {
        setQuantity(prev => prev - 1)
      }
    } else if (action === 'set' && value !== undefined) {
      if (value >= 1 && value <= selectedProduct.stock) {
        setQuantity(value)
      } else if (value > selectedProduct.stock) {
        toast.error(`Stok maksimal: ${selectedProduct.stock}`)
        setQuantity(selectedProduct.stock)
      }
    }
  }

  // Fungsi untuk menambahkan ke keranjang
  const addToCart = async () => {
    if (!selectedProduct || !token || isAddingToCart) return

    setIsAddingToCart(true)

    try {
      const requestBody = {
        product_id: selectedProduct.id,
        quantity: quantity
      }

      const response = await fetch('http://localhost:3001/api/carts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${selectedProduct.name} berhasil ditambahkan ke keranjang!`)
        
        // Update cart count
        setCartCount(prev => prev + quantity)
        
        // Tutup modal setelah sukses
        setTimeout(() => {
          closeAddToCartModal()
        }, 1500)
        
      } else {
        toast.error(data.message || 'Gagal menambahkan ke keranjang')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Terjadi kesalahan saat menambahkan ke keranjang')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // PERBAIKAN: Fungsi untuk mendapatkan harga akhir yang benar
  // discount_price adalah JUMLAH DISKON (bukan harga setelah diskon)
  const getFinalPrice = (product: Product): number => {
    const basePrice = parseFloat(product.price)
    
    // PERBAIKAN: discount_price adalah jumlah diskon, jadi kurangkan dari harga asli
    if (product.discount_price !== null && product.discount_price !== undefined) {
      const discountAmount = parseFloat(product.discount_price)
      
      // Jika discount_price > 0, kurangkan dari basePrice
      // Pastikan harga tidak negatif
      if (discountAmount > 0) {
        const finalPrice = basePrice - discountAmount
        return finalPrice > 0 ? finalPrice : 0
      }
    }
    
    return basePrice
  }

  // PERBAIKAN: Fungsi untuk cek apakah produk punya diskon
  const hasDiscount = (product: Product): boolean => {
    if (product.discount_price !== null && product.discount_price !== undefined) {
      const discountAmount = parseFloat(product.discount_price)
      
      // Diskon jika discount_price > 0 (ada jumlah diskon)
      return discountAmount > 0
    }
    
    return false
  }

  // PERBAIKAN: Hitung persentase diskon
  const calculateDiscountPercentage = (product: Product): number => {
    if (!hasDiscount(product)) return 0
    
    const basePrice = parseFloat(product.price)
    const discountAmount = parseFloat(product.discount_price!)
    
    const discountPercentage = (discountAmount / basePrice) * 100
    
    return Math.round(discountPercentage)
  }

  // PERBAIKAN: Hitung jumlah yang dihemat
  const calculateSavings = (product: Product, quantity: number = 1): number => {
    if (!hasDiscount(product)) return 0
    
    const discountAmount = parseFloat(product.discount_price!)
    return discountAmount * quantity
  }

  // PERBAIKAN: Dapatkan harga asli
  const getOriginalPrice = (product: Product): number => {
    return parseFloat(product.price)
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <main className='pt-16 md:pt-20'>
        <div className='px-4 md:px-6 lg:px-8 py-4 md:py-6'>
          {/* Welcome Banner untuk Customer */}
          <div className='mb-6 md:mb-8'>
            <div className='bg-gradient-to-r from-green-500 to-indigo-600 rounded-xl lg:rounded-2xl p-5 md:p-6 lg:p-8 text-white'>
              <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6'>
                <div className='flex-1'>
                  <h1 className='text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3'>
                    Selamat datang, {user?.full_name}! 🛍️
                  </h1>
                  <p className='text-green-100 text-sm md:text-base'>
                    Temukan produk terbaik dengan harga spesial untuk Anda
                  </p>
                </div>
                <div className='flex items-center space-x-3'>
                  <button
                    onClick={() => router.push('/modules/carts')}
                    className='relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md'
                  >
                    <ShoppingBag className='w-4 h-4 md:w-5 md:h-5' />
                    <span className='text-sm md:text-base'>Keranjang</span>
                    {cartCount > 0 && (
                      <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className='mb-6 md:mb-8'>
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Cari produk...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500'
              />
              <button className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-500'>
                <Filter className='w-5 h-5' />
              </button>
            </div>
          </div>

          {/* Categories Section */}
          <div className='mb-6 md:mb-8'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg md:text-xl lg:text-2xl font-bold text-gray-800'>
                Kategori Produk
              </h2>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-sm font-medium ${
                  !selectedCategory
                    ? 'text-green-600'
                    : 'text-gray-500 hover:text-green-600'
                }`}
              >
                Lihat Semua
              </button>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4'>
              {categories.slice(0, 6).map(category => (
                <button
                  key={category.id}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )
                  }
                  className={`flex flex-col items-center p-4 rounded-xl transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className='w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-3'>
                    <img
                      src={category.image}
                      alt={category.name}
                      className='w-full h-full object-cover'
                      onError={e => {
                        const target = e.target as HTMLImageElement
                        target.src =
                          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
                      }}
                    />
                  </div>
                  <span className='font-medium text-gray-800 text-sm text-center'>
                    {category.name}
                  </span>
                  <span className='text-gray-500 text-xs mt-1'>
                    {products.filter(p => p.category_id === category.id).length}{' '}
                    produk
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className='mb-6 md:mb-8'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg md:text-xl lg:text-2xl font-bold text-gray-800'>
                {selectedCategory
                  ? `${
                      categories.find(c => c.id === selectedCategory)?.name ||
                      'Kategori'
                    } (${filteredProducts.length} produk)`
                  : 'Semua Produk'}
              </h2>
              <div className='flex items-center space-x-2 text-sm text-gray-500'>
                <span>{filteredProducts.length} produk ditemukan</span>
              </div>
            </div>

            {filteredProducts.length === 0 && !isLoadingData ? (
              <div className='bg-white rounded-xl p-8 text-center'>
                <Package className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-700 mb-2'>
                  Produk tidak ditemukan
                </h3>
                <p className='text-gray-500 mb-4'>
                  Coba kata kunci lain atau pilih kategori yang berbeda
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                  }}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'>
                {filteredProducts.map(product => {
                  const originalPrice = getOriginalPrice(product)
                  const finalPrice = getFinalPrice(product)
                  const hasProductDiscount = hasDiscount(product)
                  const discountPercentage = calculateDiscountPercentage(product)
                  const savingsPerItem = hasProductDiscount ? originalPrice - finalPrice : 0
                  
                  return (
                    <div
                      key={product.id}
                      className='bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group'
                    >
                      {/* Product Image */}
                      <div className='relative h-48 md:h-56 bg-gray-100 overflow-hidden'>
                        <img
                          src={product.image}
                          alt={product.name}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                          onError={e => {
                            const target = e.target as HTMLImageElement
                            target.src =
                              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
                          }}
                        />
                        {product.is_featured && (
                          <div className='absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full'>
                            Featured
                          </div>
                        )}
                        {/* PERBAIKAN: Tampilkan persen diskon hanya jika ada diskon */}
                        {hasProductDiscount && (
                          <div className='absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full'>
                            {discountPercentage}% OFF
                          </div>
                        )}
                        <button className='absolute top-10 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors'>
                          <Heart className='w-4 h-4 text-gray-600' />
                        </button>
                        {product.stock < 10 && (
                          <div className='absolute bottom-3 left-3 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full'>
                            Stok terbatas
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className='p-4'>
                        <div className='mb-2'>
                          <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mb-2'>
                            {product.category_name}
                          </span>
                          <h3 className='font-semibold text-gray-800 mb-1 line-clamp-1'>
                            {product.name}
                          </h3>
                          <p className='text-gray-500 text-sm line-clamp-2 mb-3'>
                            {product.description}
                          </p>
                        </div>

                        {/* PERBAIKAN: Price Display dengan benar */}
                        <div className='mb-4'>
                          <div className='flex items-baseline gap-2'>
                            <span className='text-lg font-bold text-gray-900'>
                              {formatRupiah(finalPrice)}
                            </span>
                            {hasProductDiscount && (
                              <>
                                <span className='text-sm text-gray-500 line-through'>
                                  {formatRupiah(originalPrice)}
                                </span>
                                {/* PERBAIKAN: Tampilkan hemat berapa */}
                                <span className='text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium'>
                                  Hemat {formatRupiah(savingsPerItem)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className='flex items-center justify-between mt-1'>
                            <div className='flex items-center text-sm text-gray-500'>
                              <Package className='w-3 h-3 mr-1' />
                              {product.stock} unit tersedia
                            </div>
                            <div className='flex items-center text-sm text-yellow-500'>
                              <Star className='w-3 h-3 fill-current' />
                              <span className='ml-1'>5.0</span>
                            </div>
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => openAddToCartModal(product)}
                          disabled={product.stock === 0}
                          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                            product.stock === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                          }`}
                        >
                          <ShoppingBag className='w-4 h-4' />
                          <span>
                            {product.stock === 0
                              ? 'Stok Habis'
                              : 'Tambah ke Keranjang'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cart Summary untuk Mobile */}
          {cartCount > 0 && (
            <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40 lg:hidden'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-semibold text-gray-800'>
                    {cartCount} item di keranjang
                  </p>
                  <button 
                    onClick={() => router.push('/modules/carts')}
                    className='text-sm text-emerald-600 hover:text-emerald-700 font-medium'
                  >
                    Lihat detail
                  </button>
                </div>
                <button
                  onClick={() => router.push('/modules/carts')}
                  className='px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-colors'
                >
                  Lihat Keranjang
                </button>
              </div>
            </div>
          )}

          {/* Footer Space */}
          <div className='h-20 md:h-24'></div>
        </div>
      </main>

      {/* Add to Cart Modal */}
      {showAddToCartModal && selectedProduct && (
        <>
          {/* Backdrop */}
          <div 
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity'
            onClick={closeAddToCartModal}
          />
          
          {/* Modal */}
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-appear'>
            <div 
              className='bg-white rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className='relative p-6 border-b border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-bold text-gray-900'>
                    Tambah ke Keranjang
                  </h2>
                  <button
                    onClick={closeAddToCartModal}
                    className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                  >
                    <X className='w-5 h-5 text-gray-500' />
                  </button>
                </div>
                
                {/* Product Info */}
                <div className='flex gap-4'>
                  <div className='w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0'>
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className='w-full h-full object-cover'
                      onError={e => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
                      }}
                    />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-900 mb-1'>
                      {selectedProduct.name}
                    </h3>
                    <p className='text-sm text-gray-500 mb-2'>
                      {selectedProduct.category_name}
                    </p>
                    
                    {/* PERBAIKAN: Price display di modal dengan benar */}
                    <div className='space-y-1'>
                      <div className='flex items-baseline gap-2'>
                        <span className='text-lg font-bold text-gray-900'>
                          {formatRupiah(getFinalPrice(selectedProduct))}
                        </span>
                        {hasDiscount(selectedProduct) && (
                          <span className='text-sm text-gray-500 line-through'>
                            {formatRupiah(getOriginalPrice(selectedProduct))}
                          </span>
                        )}
                      </div>
                      
                      {/* PERBAIKAN: Tampilkan informasi diskon hanya jika ada */}
                      {hasDiscount(selectedProduct) && (
                        <div className='flex items-center gap-2'>
                          <span className='text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium'>
                            {calculateDiscountPercentage(selectedProduct)}% OFF
                          </span>
                          <span className='text-xs text-emerald-600 font-medium'>
                            Hemat {formatRupiah(calculateSavings(selectedProduct, 1))} per item
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className='text-xs text-gray-500 mt-2'>
                      Stok tersedia: {selectedProduct.stock} unit
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className='p-6'>
                {/* Quantity Selector */}
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-3'>
                    Jumlah yang ingin dibeli
                  </label>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center border border-gray-300 rounded-lg'>
                      <button
                        onClick={() => handleQuantityChange('decrease')}
                        disabled={quantity <= 1}
                        className={`px-4 py-3 ${quantity <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        <Minus className='w-4 h-4' />
                      </button>
                      
                      <div className='relative'>
                        <input
                          type='number'
                          min='1'
                          max={selectedProduct.stock}
                          value={quantity}
                          onChange={(e) => handleQuantityChange('set', parseInt(e.target.value) || 1)}
                          className='w-20 px-4 py-3 text-center text-lg font-semibold border-0 focus:ring-0 focus:outline-none text-gray-900'
                        />
                      </div>
                      
                      <button
                        onClick={() => handleQuantityChange('increase')}
                        disabled={quantity >= selectedProduct.stock}
                        className={`px-4 py-3 ${quantity >= selectedProduct.stock ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        <Plus className='w-4 h-4' />
                      </button>
                    </div>
                    
                    {/* PERBAIKAN: Perhitungan subtotal yang benar */}
                    <div className='text-right'>
                      <p className='text-sm text-gray-600'>Subtotal</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {formatRupiah(getFinalPrice(selectedProduct) * quantity)}
                      </p>
                      {/* PERBAIKAN: Tampilkan total hemat jika ada diskon */}
                      {hasDiscount(selectedProduct) && (
                        <p className='text-xs text-emerald-600 mt-1'>
                          Total hemat: {formatRupiah(calculateSavings(selectedProduct, quantity))}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className='mt-3 flex justify-between text-sm'>
                    <span className='text-gray-500'>
                      Minimal: 1 unit
                    </span>
                    <span className='text-gray-500'>
                      Maksimal: {selectedProduct.stock} unit
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3'>
                  <button
                    onClick={closeAddToCartModal}
                    className='flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors'
                    disabled={isAddingToCart}
                  >
                    Nanti Saja
                  </button>
                  
                  <button
                    onClick={addToCart}
                    disabled={isAddingToCart}
                    className='flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {isAddingToCart ? (
                      <>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className='w-4 h-4' />
                        Tambah ({quantity})
                      </>
                    )}
                  </button>
                </div>
                
                {/* Quick Actions */}
                <div className='mt-4 flex justify-center gap-4'>
                  <button
                    onClick={() => {
                      handleQuantityChange('set', Math.min(selectedProduct.stock, 5))
                    }}
                    className='text-xs px-3 py-1.5 border border-emerald-200 text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors'
                  >
                    Tambah 5
                  </button>
                  <button
                    onClick={() => {
                      handleQuantityChange('set', Math.min(selectedProduct.stock, 10))
                    }}
                    className='text-xs px-3 py-1.5 border border-emerald-200 text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors'
                  >
                    Tambah 10
                  </button>
                  {selectedProduct.stock < 20 && (
                    <button
                      onClick={() => {
                        handleQuantityChange('set', selectedProduct.stock)
                      }}
                      className='text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-full hover:bg-red-50 transition-colors'
                    >
                      Beli Semua ({selectedProduct.stock})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        /* Hide number input spinner */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
        
        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-modal-appear {
          animation: modal-appear 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}