-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  type TEXT NOT NULL, -- 'home', 'work', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, product_id) -- Prevent duplicate cart items
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  payment_id TEXT, -- Razorpay payment ID
  order_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'packed', 'shipped', 'delivered', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, -- Store product name at time of order
  price DECIMAL(10, 2) NOT NULL, -- Store price at time of order
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS Policies for tables
-- Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Products table policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);
  
CREATE POLICY "Admins can manage products" ON public.products
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Categories table policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);
  
CREATE POLICY "Admins can manage categories" ON public.categories
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Addresses table policies
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own addresses" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own addresses" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own addresses" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Cart Items table policies
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can manage their own cart" ON public.cart_items
  USING (auth.uid() = user_id);

-- Orders table policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id AND order_status = 'pending');
  
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));
  
CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Order Items table policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_address ON public.orders(address_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id); 