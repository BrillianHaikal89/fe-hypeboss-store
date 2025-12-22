// app/modules/orders/components/PaymentStatus.tsx
"use client";

import { Clock, Truck, CheckCircle, XCircle } from "lucide-react";

interface PaymentStatusProps {
  orderStatus: string;
  paymentStatus: string;
}

export default function PaymentStatus({ orderStatus, paymentStatus }: PaymentStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-800';
      case 'processing': return 'text-blue-800';
      case 'shipped': return 'text-purple-800';
      case 'delivered': return 'text-green-800';
      case 'paid': return 'text-green-800';
      case 'failed': return 'text-red-800';
      case 'expired': return 'text-gray-800';
      default: return 'text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${getStatusColor(orderStatus)}`}>
          {getStatusIcon(orderStatus)}
        </div>
        <div>
          <p className="font-semibold text-gray-900">Status Pesanan</p>
          <p className="text-sm text-gray-600 capitalize">
            {orderStatus.replace('_', ' ')}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">Status Pembayaran</p>
        <p className={`text-sm font-medium capitalize ${getStatusColorClass(paymentStatus)}`}>
          {paymentStatus}
        </p>
      </div>
    </div>
  );
}