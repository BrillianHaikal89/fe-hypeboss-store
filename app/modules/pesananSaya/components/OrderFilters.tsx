'use client'

import { Search } from 'lucide-react'

interface FilterState {
  status: string
  date: string
  search: string
}

interface OrderFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export default function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
  const handleReset = () => {
    onFiltersChange({
      status: 'all',
      date: 'all',
      search: ''
    })
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari pesanan atau produk..."
              value={filters.search}
              onChange={(e) => onFiltersChange({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3 overflow-x-auto pb-2 md:pb-0">
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({...filters, status: e.target.value})}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm sm:text-base min-w-[140px]"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Pembayaran</option>
            <option value="processing">Diproses</option>
            <option value="shipped">Dikirim</option>
            <option value="delivered">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          <select
            value={filters.date}
            onChange={(e) => onFiltersChange({...filters, date: e.target.value})}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm sm:text-base min-w-[120px]"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
          </select>

          <button
            onClick={handleReset}
            className="px-3 sm:px-4 py-2 text-gray-700 hover:text-gray-900 whitespace-nowrap text-sm sm:text-base"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}