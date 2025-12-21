'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  ShoppingBag,
  Home,
  Package,
  BarChart3,
  Users,
  Settings,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  AlertCircle,
  FileText,
  Heart
} from 'lucide-react'
import { useAuthStore } from '../../store/auth-store'

interface QuickStats {
  activeProducts: number
  todayOrders: number
  monthlyRevenue: number
}

export default function DashboardNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isAuthenticated, initializeAuth, token } = useAuthStore()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [quickStats, setQuickStats] = useState<QuickStats>({
    activeProducts: 0,
    todayOrders: 0,
    monthlyRevenue: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [cartCount, setCartCount] = useState(0) // State untuk jumlah item di keranjang

  useEffect(() => {
    setIsClient(true)
    try {
      initializeAuth()
    } catch (error) {
      console.error('Error initializing auth:', error)
      router.push('/login')
    }
  }, [initializeAuth, router])

  useEffect(() => {
    if (isClient && !isAuthenticated()) {
      if (!['/login', '/register', '/'].includes(pathname)) {
        router.push('/login')
      }
    }
  }, [isClient, isAuthenticated, pathname, router])

  // Fetch quick stats untuk admin
  useEffect(() => {
    if (isClient && user?.role === 'admin') {
      fetchQuickStats()
    }
  }, [isClient, user])

  // Fetch cart count untuk customer
  useEffect(() => {
    if (isClient && user?.role === 'customer' && token) {
      fetchCartCount()
    }
  }, [isClient, user, token])

  // Handle ESC key untuk menutup semua modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isProfileOpen) setIsProfileOpen(false)
        if (isMobileMenuOpen) setIsMobileMenuOpen(false)
        if (showLogoutConfirm) setShowLogoutConfirm(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isProfileOpen, isMobileMenuOpen, showLogoutConfirm])

  const fetchQuickStats = async () => {
    try {
      setIsLoadingStats(true)
      const response = await fetch('http://localhost:3001/api/stats/quick')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setQuickStats({
            activeProducts: data.data.activeProducts || 0,
            todayOrders: data.data.todayOrders || 0,
            monthlyRevenue: data.data.monthlyRevenue || 0
          })
        }
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

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
      setCartCount(0)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
    setShowLogoutConfirm(false)
  }

  const closeProfileMenu = useCallback(() => {
    setIsProfileOpen(false)
  }, [])

  const formatRupiah = useCallback((amount: number) => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}JT`
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}K`
    }
    return `Rp ${amount}`
  }, [])

  const getNavItems = useCallback((role: string) => {
    const adminItems = [
      {
        icon: <Home className='w-5 h-5' />,
        label: 'Dashboard',
        path: '/modules/dashboard'
      },
      {
        icon: <Package className='w-5 h-5' />,
        label: 'Produk',
        path: '/modules/products'
      },
      {
        icon: <BarChart3 className='w-5 h-5' />,
        label: 'Analitik',
        path: '/modules/analytics'
      },
      {
        icon: <Users className='w-5 h-5' />,
        label: 'Pelanggan',
        path: '/modules/customers'
      }
    ]

    const customerItems = [
      {
        icon: <Home className='w-5 h-5' />,
        label: 'Beranda',
        path: '/modules/dashboard'
      },
      {
        icon: <ShoppingBag className='w-5 h-5' />,
        label: 'Keranjang Saya',
        path: '/modules/carts'
      },
      {
        icon: <Package className='w-5 h-5' />,
        label: 'Pesanan Saya',
        path: '/modules/orders'
      },
      {
        icon: <User className='w-5 h-5' />,
        label: 'Profil',
        path: '/modules/profile'
      }
    ]

    return role === 'admin' ? adminItems : customerItems
  }, [])

  const navItems = useMemo(() => 
    getNavItems(user?.role || 'customer'), 
  [user?.role, getNavItems]
  )

  // Tampilkan skeleton loader jika belum di client atau loading
  if (!isClient || !user) {
    return (
      <nav className='fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='w-10 h-10 bg-gray-200 rounded-lg animate-pulse'></div>
              <div className='hidden md:block'>
                <div className='h-4 w-32 bg-gray-200 rounded animate-pulse mb-1'></div>
                <div className='h-3 w-24 bg-gray-200 rounded animate-pulse'></div>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-gray-200 rounded-full animate-pulse'></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Top Navbar */}
      <nav className='fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between'>
            {/* Left Section - Logo & Mobile Menu */}
            <div className='flex items-center space-x-4'>
              {/* Mobile Menu Button */}
              <button
                aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
                className='md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-900'
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className='w-5 h-5' />
                ) : (
                  <Menu className='w-5 h-5' />
                )}
              </button>

              {/* Logo */}
              <div className='flex items-center'>
                <div className='w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center'>
                  <ShoppingBag className='w-6 h-6 text-white' />
                </div>
                <div className='ml-3 hidden md:block'>
                  <h1 className='text-xl font-bold text-green-600'>
                    BossHype Store
                  </h1>
                  <p className='text-xs text-gray-800'>
                    {user?.role === 'admin' ? 'Dashboard Penjualan' : 'Belanja Online'}
                  </p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className='hidden md:flex items-center space-x-1 ml-4'>
                {navItems.map(item => (
                  <button
                    key={item.label}
                    aria-label={item.label}
                    onClick={() => {
                      router.push(item.path)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors relative ${
                      isActive(item.path)
                        ? 'bg-green-50 text-green-600'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label === 'Keranjang Saya' && cartCount > 0 && (
                      <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                        {cartCount}
                      </span>
                    )}
                    {item.icon}
                    <span className='font-medium'>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Section */}
            <div className='flex items-center space-x-3'>
              {/* Notifications */}
              <div className='relative'>
                <button 
                  aria-label='Notifikasi'
                  className='p-2 hover:bg-gray-100 rounded-lg relative text-gray-900'
                >
                  <Bell className='w-5 h-5' />
                  <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
                </button>
              </div>

              {/* User Profile */}
              <div className='relative'>
                <button
                  aria-label='Menu profil'
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className='flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg text-gray-900'
                >
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.full_name}
                        className='w-full h-full rounded-full object-cover'
                      />
                    ) : (
                      <User className='w-4 h-4 text-green-600' />
                    )}
                  </div>
                  <div className='hidden md:block text-left'>
                    <div className='flex items-center'>
                      <p className='text-sm font-medium text-gray-900'>
                        {user?.full_name}
                      </p>
                      <ChevronDown
                        className={`w-4 h-4 ml-1 transition-transform text-gray-900 ${
                          isProfileOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    <p className='text-xs text-gray-800 capitalize'>
                      {user?.role === 'admin' ? 'Administrator' : 'Pelanggan'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <>
                    <div
                      className='fixed inset-0 z-40'
                      onClick={closeProfileMenu}
                    />
                    <div className='absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-50'>
                      <div className='p-4 border-b'>
                        <p className='font-medium text-gray-900'>
                          {user?.full_name}
                        </p>
                        <p className='text-sm text-gray-800'>
                          @{user?.username}
                        </p>
                        <p className='text-xs text-gray-800 mt-1 capitalize'>
                          {user?.role === 'admin' ? 'Administrator' : 'Pelanggan'}
                        </p>
                      </div>

                      {/* Quick Stats in Dropdown (hanya untuk admin) */}
                      {user?.role === 'admin' && (
                        <div className='p-4 border-b'>
                          <h3 className='text-sm font-medium text-gray-800 mb-3'>
                            Ringkasan Cepat
                          </h3>
                          <div className='space-y-3'>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-gray-900'>
                                Produk Aktif
                              </span>
                              {isLoadingStats ? (
                                <div className='h-4 w-8 bg-gray-200 rounded animate-pulse'></div>
                              ) : (
                                <span className='font-bold text-green-600'>
                                  {quickStats.activeProducts}
                                </span>
                              )}
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-gray-900'>
                                Pesanan Hari Ini
                              </span>
                              {isLoadingStats ? (
                                <div className='h-4 w-8 bg-gray-200 rounded animate-pulse'></div>
                              ) : (
                                <span className='font-bold text-blue-600'>
                                  {quickStats.todayOrders}
                                </span>
                              )}
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-gray-900'>
                                Pendapatan Bulan Ini
                              </span>
                              {isLoadingStats ? (
                                <div className='h-4 w-12 bg-gray-200 rounded animate-pulse'></div>
                              ) : (
                                <span className='font-bold text-purple-600'>
                                  {formatRupiah(quickStats.monthlyRevenue)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className='p-2'>
                        {user?.role === 'customer' && (
                          <>
                            <button
                              onClick={() => {
                                router.push('/modules/orders')
                                closeProfileMenu()
                              }}
                              className='w-full flex items-center space-x-2 px-3 py-2.5 text-sm hover:bg-gray-100 rounded-lg text-gray-900 relative'
                            >
                              {cartCount > 0 && (
                                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                                  {cartCount}
                                </span>
                              )}
                              <FileText className='w-4 h-4' />
                              <span>Pesanan Saya</span>
                            </button>
                            <button
                              onClick={() => {
                                router.push('/modules/wishlist')
                                closeProfileMenu()
                              }}
                              className='w-full flex items-center space-x-2 px-3 py-2.5 text-sm hover:bg-gray-100 rounded-lg text-gray-900'
                            >
                              <Heart className='w-4 h-4' />
                              <span>Wishlist</span>
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            router.push(user?.role === 'admin' ? '/modules/settings' : '/modules/profile')
                            closeProfileMenu()
                          }}
                          className='w-full flex items-center space-x-2 px-3 py-2.5 text-sm hover:bg-gray-100 rounded-lg text-gray-900'
                        >
                          <Settings className='w-4 h-4' />
                          <span>Pengaturan</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            closeProfileMenu()
                            setShowLogoutConfirm(true)
                          }}
                          className='w-full flex items-center space-x-2 px-3 py-2.5 text-sm hover:bg-gray-100 rounded-lg text-red-600'
                        >
                          <LogOut className='w-4 h-4' />
                          <span>Keluar</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className='md:hidden mt-3 pt-3 border-t'>
              <div className='space-y-1'>
                {navItems.map(item => (
                  <button
                    key={item.label}
                    aria-label={item.label}
                    onClick={() => {
                      router.push(item.path)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors relative ${
                      isActive(item.path)
                        ? 'bg-green-50 text-green-600'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`${
                        isActive(item.path)
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className='font-medium'>{item.label}</span>
                    {item.label === 'Keranjang Saya' && cartCount > 0 && (
                      <span className='absolute right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                        {cartCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm'
            onClick={() => setShowLogoutConfirm(false)}
          />

          {/* Modal Content */}
          <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
            <div className='bg-white rounded-xl shadow-2xl w-full max-w-md mx-4'>
              <div className='p-6'>
                <div className='flex items-center justify-center mb-4'>
                  <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                    <AlertCircle className='w-6 h-6 text-red-600' />
                  </div>
                </div>

                <h2 className='text-xl font-bold text-center text-gray-900 mb-2'>
                  Konfirmasi Keluar
                </h2>

                <p className='text-gray-800 text-center mb-6'>
                  Apakah Anda yakin ingin keluar dari akun Anda? Anda perlu
                  masuk kembali untuk mengakses dashboard.
                </p>

                <div className='flex space-x-3'>
                  <button
                    aria-label='Batal logout'
                    onClick={() => setShowLogoutConfirm(false)}
                    className='flex-1 py-3 border border-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    Batal
                  </button>
                  <button
                    aria-label='Ya, keluar'
                    onClick={handleLogout}
                    className='flex-1 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2'
                  >
                    <LogOut className='w-4 h-4' />
                    <span>Ya, Keluar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}