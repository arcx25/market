export type UserRole = "buyer" | "seller"

export type EscrowStatus = "pending" | "paid" | "shipped" | "delivered" | "completed" | "disputed"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  pgp_public_key: string | null
  pgp_fingerprint: string | null
  upgraded_to_seller_at: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  description: string | null
  created_at: string
}

export interface Product {
  id: string
  vendor_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock_quantity: number
  is_active: boolean
  category_id: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  buyer_id: string
  total_amount: number
  status: string
  shipping_address: string | null
  shipping_city: string | null
  shipping_postal_code: string | null
  xmr_payment_address: string | null
  xmr_amount: number | null
  escrow_status: EscrowStatus
  buyer_confirmed_at: string | null
  seller_paid_at: string | null
  created_at: string
  updated_at: string
}
