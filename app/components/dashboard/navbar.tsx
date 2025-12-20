'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  ShoppingBag,
  Home,
  Package,
  BarChart3,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../../store/auth-store'

export default function DashboardNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isAuthenticated, initializeAuth } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  useEffect(() => {
    setIsClient(true)
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (isClient && !isAuthenticated() && pathname.startsWith('/app/')) {
      router.push('/login')
    }
  }, [isClient, isAuthenticated, pathname, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
    setShowLogoutConfirm(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Redirect ke halaman search dengan query
      router.push(`/app/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsMobileMenuOpen(false)
      setShowMobileSearch(false)
    }
  }

  const handleMobileSearchClick = () => {
    setShowMobileSearch(true)
    setIsMobileMenuOpen(false)
  }

  const navItems = [
    {
      icon: <Home className='w-5 h-5' />,
      label: 'Dashboard',
      path: '/app/dashboard'
    },
    {
      icon: <Package className='w-5 h-5' />,
      label: 'Produk',
      path: '/app/products'
    },
    {
      icon: <BarChart3 className='w-5 h-5' />,
      label: 'Analitik',
      path: '/app/analytics'
    },
    {
      icon: <Users className='w-5 h-5' />,
      label: 'Pelanggan',
      path: '/app/customers'
    }
  ]

  // Tampilkan skeleton loader jika belum di client
  if (!isClient) {
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

  return (
    <>
      {/* Top Navbar */}
      <nav className='fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between'>
            {/* Left Section - Logo & Mobile Menu */}
            <div className='flex items-center space-x-4'>
              {/* Mobile Menu Button - Tampilkan jika tidak dalam mode search mobile */}
              {!showMobileSearch && (
                <button
                  className='md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-900'
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className='w-5 h-5' />
                  ) : (
                    <Menu className='w-5 h-5' />
                  )}
                </button>
              )}

              {/* Logo - Sembunyikan dalam mode search mobile */}
              {!showMobileSearch && (
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center'>
                    <ShoppingBag className='w-6 h-6 text-white' />
                  </div>
                  <div className='ml-3 hidden md:block'>
                    <h1 className='text-xl font-bold text-green-600'>
                      BossHype Store
                    </h1>
                    <p className='text-xs text-gray-800'>Dashboard Penjualan</p>
                  </div>
                </div>
              )}

              {/* Mobile Search Bar (Full Width) */}
              {showMobileSearch && (
                <div className='flex-1'>
                  <form onSubmit={handleSearch} className='relative'>
                    <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                    <input
                      type='text'
                      placeholder='Cari produk, pelanggan, atau pesanan...'
                      className='w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500'
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    {/* Tombol Close untuk mobile search */}
                    <button
                      type='button'
                      onClick={() => setShowMobileSearch(false)}
                      className='absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded'
                    >
                      <X className='w-5 h-5 text-gray-500' />
                    </button>
                  </form>
                </div>
              )}

              {/* Desktop Navigation */}
              {!showMobileSearch && (
                <div className='hidden md:flex items-center space-x-1 ml-4'>
                  {navItems.map(item => (
                    <button
                      key={item.label}
                      onClick={() => {
                        router.push(item.path)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        pathname === item.path
                          ? 'bg-green-50 text-green-600'
                          : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {item.icon}
                      <span className='font-medium'>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Center Section - Search (Desktop only) */}
            {!showMobileSearch && (
              <div className='flex-1 max-w-2xl mx-4 hidden md:block'>
                <form onSubmit={handleSearch} className='relative'>
                  <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    type='text'
                    placeholder='Cari produk, pelanggan, atau pesanan...'
                    className='w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <button
                    type='submit'
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded opacity-50 hover:opacity-100'
                  >
                    <Search className='w-5 h-5 text-gray-600' />
                  </button>
                </form>
              </div>
            )}

            {/* Right Section */}
            {!showMobileSearch && (
              <div className='flex items-center space-x-3'>
                {/* Mobile Search Button */}
                <button
                  className='md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-900'
                  onClick={handleMobileSearchClick}
                >
                  <Search className='w-5 h-5' />
                </button>

                {/* Notifications */}
                <div className='relative'>
                  <button className='p-2 hover:bg-gray-100 rounded-lg relative text-gray-900'>
                    <Bell className='w-5 h-5' />
                    <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
                  </button>
                </div>

                {/* User Profile */}
                <div className='relative'>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className='flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg text-gray-900'
                  >
                    <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                      <User className='w-4 h-4 text-green-600' />
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
                        {user?.role}
                      </p>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <>
                      <div
                        className='fixed inset-0 z-40'
                        onClick={() => setIsProfileOpen(false)}
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
                            {user?.role}
                          </p>
                        </div>

                        {/* Quick Stats in Dropdown */}
                        <div className='p-4 border-b'>
                          <h3 className='text-sm font-medium text-gray-800 mb-3'>
                            Ringkasan Cepat
                          </h3>
                          <div className='space-y-3'>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-gray-900'>
                                Produk Aktif
                              </span>
                              <span className='font-bold text-green-600'>
                                24
                              </span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-gray-900'>
                                Pesanan Hari Ini
                              </span>
                              <span className='font-bold text-blue-600'>8</span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-gray-900'>
                                Pendapatan Bulan Ini
                              </span>
                              <span className='font-bold text-purple-600'>
                                12.5JT
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className='p-2'>
                          <button
                            onClick={() => {
                              router.push('/app/settings')
                              setIsProfileOpen(false)
                            }}
                            className='w-full flex items-center space-x-2 px-3 py-2.5 text-sm hover:bg-gray-100 rounded-lg text-gray-900'
                          >
                            <Settings className='w-4 h-4' />
                            <span>Pengaturan</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsProfileOpen(false)
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
            )}
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className='md:hidden mt-3 pt-3 border-t'>
              <div className='space-y-1'>
                {navItems.map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      router.push(item.path)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${
                      pathname === item.path
                        ? 'bg-green-50 text-green-600'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`${
                        pathname === item.path
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className='font-medium'>{item.label}</span>
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
                    onClick={() => setShowLogoutConfirm(false)}
                    className='flex-1 py-3 border border-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    Batal
                  </button>
                  <button
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