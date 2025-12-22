'use client'

import { ShoppingBag, Clock, Package, Truck, CheckCircle } from 'lucide-react'

interface OrderStatsProps {
  stats: {
    total: number
    pending: number
    processing: number
    shipped: number
    delivered: number
  }
}

export default function OrderStats({ stats }: OrderStatsProps) {
  const statItems = [
    {
      label: 'Total Pesanan',
      value: stats.total,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Menunggu Bayar',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      label: 'Diproses',
      value: stats.processing,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Dikirim',
      value: stats.shipped,
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Selesai',
      value: stats.delivered,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">{item.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}