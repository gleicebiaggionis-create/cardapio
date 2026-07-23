import { createClient } from '@supabase/supabase-js';

// Supabase environment configuration
const env = (import.meta as any).env || {};
const rawUrl = env.VITE_SUPABASE_URL;
const rawKey = env.VITE_SUPABASE_ANON_KEY;

function getValidSupabaseUrl(input: unknown): string {
  if (typeof input === 'string' && input.trim().length > 0) {
    const trimmed = input.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return parsed.href.replace(/\/$/, '');
        }
      } catch {
        // Invalid URL format
      }
    }
  }
  return 'https://brazzuno-app.supabase.co';
}

function getValidSupabaseKey(input: unknown): string {
  if (typeof input === 'string' && input.trim().length > 0) {
    return input.trim();
  }
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYXp6dW5vLXBsYXRmb3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTA0MDAwMH0.placeholder';
}

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  typeof rawUrl === 'string' &&
  (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) &&
  !rawUrl.includes('your-supabase-project') &&
  !rawUrl.includes('brazzuno-app.supabase.co')
);

const supabaseUrl = getValidSupabaseUrl(rawUrl);
const supabaseAnonKey = getValidSupabaseKey(rawKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Auth helper functions
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured) {
    // Local / Demo mode simulated auth
    return { user: { email: 'gleicebiaggionis@gmail.com', user_metadata: { full_name: 'Gleice Biaggionis' } }, error: null };
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/admin`,
    },
  });
  if (error) throw error;
  return data;
};

export const handleSignOut = async () => {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// SQL Schema DDL definition for Supabase SQL Editor execution
export const SUPABASE_SQL_SCHEMA = `-- BRAZZUNO CARDÁPIO ONLINE & ERP/CRM - SUPABASE DATABASE SCHEMA
-- Execute este script no SQL Editor do Supabase para criar a estrutura completa

-- 1. Tabela de Configurações do Restaurante
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Brazzuno - Hamburgueria & Grelhados',
  phone TEXT DEFAULT '11999999999',
  address TEXT DEFAULT 'Av. Principal, 1000 - Centro',
  pickup_address TEXT DEFAULT 'Av. Principal, 1000 - Centro',
  whatsapp TEXT DEFAULT '11999999999',
  instagram TEXT DEFAULT 'brazzunoburger',
  delivery_fee NUMERIC(10,2) DEFAULT 7.50,
  min_order_value NUMERIC(10,2) DEFAULT 20.00,
  estimated_delivery_time TEXT DEFAULT '30-45 min',
  estimated_pickup_time TEXT DEFAULT '15-25 min',
  business_hours TEXT DEFAULT 'Terça a Domingo das 18:00 às 23:30',
  is_open BOOLEAN DEFAULT true,
  pix_key_type TEXT DEFAULT 'cnpj',
  pix_key TEXT DEFAULT '12.345.678/0001-90',
  pix_receiver_name TEXT DEFAULT 'Brazzuno Alimentos LTDA',
  pix_city TEXT DEFAULT 'Sao Paulo',
  branding JSONB DEFAULT '{"primaryColor": "#10B981", "logoUrl": "", "faviconUrl": "", "bannerUrl": ""}'::jsonb,
  seo_settings JSONB DEFAULT '{"title": "Brazzuno - O Melhor Hambúrguer Artesanal", "description": "Peça online os melhores hambúrgueres e grelhados do Brazzuno.", "keywords": "hambúrguer, delivery, brazzuno, comida"}'::jsonb,
  delivery_zones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Utensils',
  order_index INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  promo_price NUMERIC(10,2),
  cost_price NUMERIC(10,2) DEFAULT 0,
  sku TEXT,
  image TEXT,
  prep_time TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_badge TEXT,
  stock INT DEFAULT 999,
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Banners
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT NOT NULL,
  button_text TEXT,
  button_link TEXT,
  bg_color TEXT DEFAULT 'bg-emerald-600',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Cupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_discount_value NUMERIC(10,2),
  valid_until TIMESTAMPTZ,
  usage_limit INT DEFAULT 100,
  times_used INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Clientes (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT UNIQUE NOT NULL,
  email TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  total_spent NUMERIC(10,2) DEFAULT 0,
  orders_count INT DEFAULT 0,
  is_vip BOOLEAN DEFAULT false,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, preparing, ready, delivery, completed, cancelled
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- pix, online_pix, card, cash
  payment_details JSONB DEFAULT '{}'::jsonb,
  address JSONB NOT NULL,
  status_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Transações Financeiras (ERP)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'income' or 'expense'
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'paid', -- 'paid' or 'pending'
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Politicas de acesso público para leitura do cardápio
CREATE POLICY "Public Read Settings" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Public Read Coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Customers" ON public.customers FOR INSERT WITH CHECK (true);

-- Ativar realtime no Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
`;
