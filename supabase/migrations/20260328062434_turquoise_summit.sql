/*
  # Dashboard System Tables

  1. New Tables
    - `wishlists` - User wishlist management
    - `transactions` - Transaction history
    - `refunds` - Refund tracking
    - `support_tickets` - Customer support tickets
    - `user_sessions` - User session tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
*/

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  transaction_type text CHECK (transaction_type IN ('payment', 'refund', 'wallet_credit', 'wallet_debit')) DEFAULT 'payment',
  payment_method text,
  gateway text,
  gateway_transaction_id text,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'INR',
  status text CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  description text,
  gateway_response jsonb,
  created_at timestamptz DEFAULT now()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id),
  refund_amount decimal(10,2) NOT NULL,
  refund_reason text NOT NULL,
  refund_status text CHECK (refund_status IN ('requested', 'processing', 'approved', 'rejected', 'completed')) DEFAULT 'requested',
  refund_method text,
  gateway_refund_id text,
  processed_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticket_number text UNIQUE NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  category text CHECK (category IN ('order_issue', 'payment_issue', 'product_issue', 'delivery_issue', 'refund_issue', 'general_inquiry', 'technical_issue')) DEFAULT 'general_inquiry',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status text CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  assigned_to uuid,
  resolution text,
  attachments text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User sessions table for tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  ip_address inet,
  user_agent text,
  location_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their wishlists"
  ON wishlists FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their transactions"
  ON transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their refunds"
  ON refunds FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their support tickets"
  ON support_tickets FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their sessions"
  ON user_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 'TKT(\d+)') AS integer)), 0) + 1
  INTO counter
  FROM support_tickets;
  
  new_number := 'TKT' || LPAD(counter::text, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update refunds timestamp
CREATE OR REPLACE FUNCTION update_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_refunds_updated_at_trigger
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_refunds_updated_at();

-- Update support tickets timestamp
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at_trigger
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);