/*
  # Complete Cart and Checkout System

  1. New Tables
    - Enhanced cart_items table
    - orders table with payment tracking
    - order_items table
    - order_tracking table for shipping status
    - payment_transactions table
    - coupons table for discounts

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
*/

-- Enhanced cart_items table (if not exists)
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_number text UNIQUE NOT NULL,
  status text CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')) DEFAULT 'pending',
  payment_status text CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cod_pending')) DEFAULT 'pending',
  payment_method text CHECK (payment_method IN ('razorpay', 'cod', 'wallet')) DEFAULT 'cod',
  payment_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  subtotal decimal(10,2) NOT NULL,
  delivery_fee decimal(10,2) DEFAULT 0,
  tax_amount decimal(10,2) DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  coupon_code text,
  total_amount decimal(10,2) NOT NULL,
  delivery_address jsonb NOT NULL,
  billing_address jsonb,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  product_image text,
  product_brand text,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  weight text,
  unit text,
  created_at timestamptz DEFAULT now()
);

-- Order tracking table
CREATE TABLE IF NOT EXISTS order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  tracking_number text,
  estimated_delivery timestamptz,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  payment_method text NOT NULL,
  payment_gateway text,
  transaction_id text,
  gateway_transaction_id text,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'INR',
  status text CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  gateway_response jsonb,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
  discount_value decimal(10,2) NOT NULL,
  min_order_amount decimal(10,2) DEFAULT 0,
  max_discount decimal(10,2),
  usage_limit integer,
  used_count integer DEFAULT 0,
  user_limit integer DEFAULT 1,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  applicable_categories uuid[],
  applicable_products uuid[],
  created_at timestamptz DEFAULT now()
);

-- User coupon usage tracking
CREATE TABLE IF NOT EXISTS user_coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, coupon_id, order_id)
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupon_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their cart items"
  ON cart_items FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their orders"
  ON orders FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their order items"
  ON order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their order tracking"
  ON order_tracking FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_tracking.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their payment transactions"
  ON payment_transactions FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coupons are publicly readable"
  ON coupons FOR SELECT TO public
  USING (is_active = true AND now() BETWEEN valid_from AND valid_until);

CREATE POLICY "Users can view their coupon usage"
  ON user_coupon_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Functions and Triggers

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'PN\d{8}-(\d+)') AS integer)), 0) + 1
  INTO counter
  FROM orders
  WHERE order_number LIKE 'PN' || to_char(now(), 'YYYYMMDD') || '-%';
  
  new_number := 'PN' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(counter::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update cart items timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_items_updated_at_trigger
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- Update orders timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Update payment transactions timestamp
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_transactions_updated_at_trigger
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_user_id ON user_coupon_usage(user_id);