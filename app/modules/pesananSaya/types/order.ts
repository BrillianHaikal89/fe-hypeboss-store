export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  product_price: string
  quantity: number
  subtotal: string
  created_at: string
  product_image: string
  original_price: number
  discount_value: string
  product_original_price: string
  discount_per_item: string
  discount_price: number
}

export interface OrderSummary {
  total_items: number
  total_original_price: number
  total_discount: number
}

export interface Order {
  id: number
  order_code: string
  user_id: number
  total_amount: string
  shipping_cost: string
  final_amount: string
  shipping_address: string
  shipping_phone: string
  notes: string | null
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'expired'
  payment_method: 'bank_transfer' | 'credit_card' | 'e_wallet'
  payment_proof: string | null
  created_at: string
  updated_at: string
  midtrans_transaction_id: string | null
  payment_type: string | null
  total_count: string
  items: OrderItem[]
  summary: OrderSummary
}

export interface OrdersResponse {
  success: boolean
  data: {
    orders: Order[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface FilterState {
  status: string
  date: string
  search: string
}