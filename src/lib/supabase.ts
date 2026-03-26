import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  images?: string[];
  category_id?: string;
  brand_id?: string;
  stock_quantity: number;
  unit: string;
  weight?: string;
  is_featured: boolean;
  is_best_deal: boolean;
  is_trending: boolean;
  discount_percentage: number;
  tags?: string[];
  nutritional_info?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  brand?: Brand;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'buy_get';
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  image_url?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  usage_limit?: number;
  used_count: number;
  applicable_products?: string[];
  applicable_categories?: string[];
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_id?: string;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  delivery_address: Record<string, any>;
  estimated_delivery?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  review_text?: string;
  images?: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  user_liked?: boolean;
  comments?: ReviewComment[];
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  user_liked?: boolean;
  likes_count?: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  status: string;
  message?: string;
  location?: string;
  estimated_delivery?: string;
  created_at: string;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_item_id: string;
  user_id: string;
  reason: string;
  description?: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  refund_amount?: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  title: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
}

// Helper functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price);
};

export const calculateDiscountedPrice = (originalPrice: number, discountPercentage: number): number => {
  return originalPrice - (originalPrice * discountPercentage / 100);
};