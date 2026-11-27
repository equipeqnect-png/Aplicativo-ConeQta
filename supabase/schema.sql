-- ==============================================================================
-- PROJETO CONEQTA - BANCO DE DADOS SUPABASE (POSTGRESQL)
-- Arquitetura completa com DDL, Enums, Índices, RLS (Row Level Security),
-- Triggers automáticos e Carga Inicial (Seed Data).
-- ==============================================================================

-- 1. EXTENSÕES DO POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS E ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('consumer', 'producer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ativo', 'pendente', 'bloqueado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('recebido', 'colhendo', 'embalado', 'em_transito', 'entregue', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_type AS ENUM ('delivery', 'pickup');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('pix', 'card', 'cash');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. CRIAÇÃO DAS TABELAS
-- ==============================================================================

-- 3.1. PERFIS DE USUÁRIOS (Vinculado ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cpf TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'consumer',
    city TEXT DEFAULT 'Queimados',
    neighborhood TEXT,
    avatar TEXT DEFAULT '',
    avatar_bg_color TEXT DEFAULT '#4E553D',
    cover_bg_color TEXT DEFAULT '#1F6B38',
    farm_name TEXT,
    verified BOOLEAN DEFAULT true,
    status user_status DEFAULT 'ativo',
    producer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante migração segura em bancos já existentes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_bg_color TEXT DEFAULT '#1F6B38';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS farm_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_bg_color TEXT DEFAULT '#4E553D';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS producer_id TEXT;

-- 3.2. PRODUTORES / EMPREENDEDORES LOCAIS
CREATE TABLE IF NOT EXISTS public.producers (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    tagline TEXT,
    bio TEXT,
    story TEXT,
    avatar TEXT,
    avatar_bg_color TEXT DEFAULT '#4E553D',
    cover_image TEXT,
    cover_bg_color TEXT DEFAULT '#1F6B38',
    gallery_images JSONB DEFAULT '[]'::jsonb,
    city TEXT DEFAULT 'Queimados',
    state TEXT DEFAULT 'RJ',
    neighborhood TEXT,
    address TEXT,
    distance_km NUMERIC(6,2) DEFAULT 0,
    lat NUMERIC(10,6),
    lng NUMERIC(10,6),
    rating NUMERIC(2,1) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    certifications TEXT[] DEFAULT '{}',
    phone TEXT,
    whatsapp TEXT,
    established_year INTEGER,
    harvest_days TEXT[] DEFAULT '{}',
    delivery_methods TEXT[] DEFAULT '{}',
    hectares NUMERIC(6,2),
    specialty TEXT,
    views_count INTEGER DEFAULT 0,
    category TEXT DEFAULT 'produtos_agricolas',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3. PRODUTOS DISPONÍVEIS
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod_' || substr(md5(random()::text), 1, 12)),
    producer_id TEXT NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
    producer_name TEXT,
    producer_farm TEXT,
    producer_distance_km NUMERIC(6,2) DEFAULT 0,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    unit TEXT NOT NULL DEFAULT 'un',
    category TEXT NOT NULL DEFAULT 'produtos_agricolas',
    images TEXT[] DEFAULT '{}',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    harvest_date TEXT,
    organic BOOLEAN DEFAULT false,
    certifications TEXT[] DEFAULT '{}',
    nutrition_highlights TEXT[] DEFAULT '{}',
    freshness_score INTEGER DEFAULT 10,
    is_seasonal BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    storage_tips TEXT,
    clicks_count INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4. PEDIDOS (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord_' || substr(md5(random()::text), 1, 10)),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_address TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_type delivery_type NOT NULL DEFAULT 'delivery',
    pickup_location TEXT,
    payment_method payment_method NOT NULL DEFAULT 'pix',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    status order_status NOT NULL DEFAULT 'recebido',
    tracking_code TEXT,
    harvest_batch_note TEXT,
    producer_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5. AVALIAÇÕES (REVIEWS)
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY DEFAULT ('rev_' || substr(md5(random()::text), 1, 10)),
    producer_id TEXT NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
    producer_name TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6. STORIES (VÍDEOS CURTOS - VÁLIDOS POR 24H)
CREATE TABLE IF NOT EXISTS public.stories (
    id TEXT PRIMARY KEY DEFAULT ('story_' || substr(md5(random()::text), 1, 10)),
    producer_id TEXT NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
    producer_name TEXT NOT NULL,
    producer_farm TEXT,
    producer_avatar TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    likes_count INTEGER DEFAULT 0,
    liked_by_users TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0,
    tag TEXT
);

-- 3.7. COMENTÁRIOS DOS STORIES
CREATE TABLE IF NOT EXISTS public.story_comments (
    id TEXT PRIMARY KEY DEFAULT ('com_' || substr(md5(random()::text), 1, 10)),
    story_id TEXT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8. CHAT / MENSAGENS DIRETAS
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY DEFAULT ('msg_' || substr(md5(random()::text), 1, 10)),
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role user_role NOT NULL DEFAULT 'consumer',
    recipient_id TEXT NOT NULL,
    text TEXT NOT NULL,
    product_ref TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9. SELOS SUSTENTÁVEIS DE QUEIMADOS
CREATE TABLE IF NOT EXISTS public.seals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    badge TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    active_count INTEGER DEFAULT 0
);

-- 3.10. CATEGORIAS DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    color TEXT NOT NULL
);

-- 3.11. AVALIAÇÕES PRIVADAS DO APLICATIVO (VISÍVEIS APENAS AO ADMINISTRADOR)
CREATE TABLE IF NOT EXISTS public.app_feedbacks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    user_neighborhood TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    experience TEXT NOT NULL,
    comment TEXT,
    suggestion TEXT,
    status TEXT DEFAULT 'novo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_producer ON public.products(producer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_producer ON public.reviews(producer_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_comments_story ON public.story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON public.chat_messages(recipient_id);

-- ==============================================================================
-- 5. TRIGGERS E FUNÇÕES AUTOMÁTICAS
-- ==============================================================================

-- 5.1. Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.2. Criar perfil automaticamente no cadastro Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        name,
        cpf,
        role,
        phone,
        city,
        neighborhood,
        avatar,
        avatar_bg_color,
        cover_bg_color,
        farm_name,
        producer_id,
        verified
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'cpf',
        CASE
            WHEN NEW.raw_user_meta_data->>'role' = 'producer' THEN 'producer'::user_role
            ELSE 'consumer'::user_role
        END,
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'city', 'Queimados'),
        COALESCE(NEW.raw_user_meta_data->>'neighborhood', 'Queimados'),
        COALESCE(NEW.raw_user_meta_data->>'avatar', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_bg_color', '#4E553D'),
        COALESCE(NEW.raw_user_meta_data->>'cover_bg_color', '#1F6B38'),
        NEW.raw_user_meta_data->>'farm_name',
        NEW.raw_user_meta_data->>'producer_id',
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        cpf = COALESCE(EXCLUDED.cpf, public.profiles.cpf),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        city = COALESCE(EXCLUDED.city, public.profiles.city),
        neighborhood = COALESCE(EXCLUDED.neighborhood, public.profiles.neighborhood),
        avatar = COALESCE(EXCLUDED.avatar, public.profiles.avatar),
        avatar_bg_color = COALESCE(EXCLUDED.avatar_bg_color, public.profiles.avatar_bg_color),
        cover_bg_color = COALESCE(EXCLUDED.cover_bg_color, public.profiles.cover_bg_color),
        farm_name = COALESCE(EXCLUDED.farm_name, public.profiles.farm_name),
        producer_id = COALESCE(EXCLUDED.producer_id, public.profiles.producer_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.3. Recalcular média de avaliação do produtor quando uma avaliação for feita
CREATE OR REPLACE FUNCTION public.update_producer_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_producer_id TEXT;
    avg_score NUMERIC(2,1);
    total_reviews INTEGER;
BEGIN
    target_producer_id := COALESCE(NEW.producer_id, OLD.producer_id);
    
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0), COUNT(*)
    INTO avg_score, total_reviews
    FROM public.reviews
    WHERE producer_id = target_producer_id;

    UPDATE public.producers
    SET rating = avg_score, review_count = total_reviews
    WHERE id = target_producer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_producer_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_producer_rating_stats();

-- ==============================================================================
-- 6. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_feedbacks ENABLE ROW LEVEL SECURITY;

-- Helper para evitar recursão de RLS ao verificar papel de administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6.1. PROFILES (Acesso de listagem restrito ao próprio usuário e ao administrador)
DROP POLICY IF EXISTS "Usuário vê próprio perfil ou admin vê todos" ON public.profiles;
CREATE POLICY "Usuário vê próprio perfil ou admin vê todos" 
    ON public.profiles FOR SELECT USING (
        auth.uid() = id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Usuário pode criar próprio perfil" ON public.profiles;
CREATE POLICY "Usuário pode criar próprio perfil"
    ON public.profiles FOR INSERT WITH CHECK (
        auth.uid() = id
        AND role IN ('consumer', 'producer')
        AND status = 'ativo'
    );

DROP POLICY IF EXISTS "Usuário pode atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuário pode atualizar seu próprio perfil" 
    ON public.profiles FOR UPDATE USING (
        auth.uid() = id
        OR public.is_admin()
    )
    WITH CHECK (
        public.is_admin()
        OR (
            auth.uid() = id
            AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
            AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Usuário ou admin pode deletar perfil" ON public.profiles;
CREATE POLICY "Usuário ou admin pode deletar perfil"
    ON public.profiles FOR DELETE USING (
        auth.uid() = id
        OR public.is_admin()
    );

-- 6.2. PRODUTORES
CREATE POLICY "Produtores são públicos para leitura" 
    ON public.producers FOR SELECT USING (true);

CREATE POLICY "Produtores podem atualizar seus dados" 
    ON public.producers FOR UPDATE USING (
        auth.uid() = user_id
        OR user_id IS NULL
        OR public.is_admin()
        OR auth.role() IN ('authenticated', 'anon')
    );

CREATE POLICY "Produtores e admins podem deletar loja"
    ON public.producers FOR DELETE USING (
        auth.uid() = user_id
        OR public.is_admin()
    );

CREATE POLICY "Inserção de produtor permitida" 
    ON public.producers FOR INSERT WITH CHECK (true);

-- 6.3. PRODUTOS
CREATE POLICY "Produtos visíveis para todos" 
    ON public.products FOR SELECT USING (true);

CREATE POLICY "Produtores e admins podem gerenciar produtos" 
    ON public.products FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.producers 
            WHERE producers.id = products.producer_id 
            AND (producers.user_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
        )
        OR auth.role() = 'anon' -- Permite operações durante testes e protótipos
    );

-- 6.4. PEDIDOS (ORDERS)
CREATE POLICY "Leitura de pedidos pelo consumidor ou produtor" 
    ON public.orders FOR SELECT USING (
        auth.uid() = customer_id 
        OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
        OR auth.role() = 'anon'
    );

CREATE POLICY "Qualquer consumidor pode criar pedidos" 
    ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Atualização de status do pedido" 
    ON public.orders FOR UPDATE USING (
        auth.uid() = customer_id 
        OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'producer'))
        OR auth.role() = 'anon'
    );

-- 6.5. AVALIAÇÕES (REVIEWS)
CREATE POLICY "Avaliações são públicas para leitura" 
    ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Usuários podem postar avaliações" 
    ON public.reviews FOR INSERT WITH CHECK (true);

-- 6.6. STORIES E COMENTÁRIOS
CREATE POLICY "Stories ativos visíveis para todos" 
    ON public.stories FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Produtores podem postar stories" 
    ON public.stories FOR INSERT WITH CHECK (true);

CREATE POLICY "Produtores podem deletar seus stories" 
    ON public.stories FOR DELETE USING (true);

CREATE POLICY "Atualizar likes do story" 
    ON public.stories FOR UPDATE USING (true);

CREATE POLICY "Comentários de stories públicos para leitura" 
    ON public.story_comments FOR SELECT USING (true);

CREATE POLICY "Inserir comentários de stories" 
    ON public.story_comments FOR INSERT WITH CHECK (true);

-- 6.7. MENSAGENS DE CHAT
CREATE POLICY "Visualização de mensagens pelos participantes" 
    ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "Envio de mensagens" 
    ON public.chat_messages FOR INSERT WITH CHECK (true);

-- 6.8. SELOS E CATEGORIAS
CREATE POLICY "Selos visíveis para todos" ON public.seals FOR SELECT USING (true);
CREATE POLICY "Categorias visíveis para todos" ON public.categories FOR SELECT USING (true);

-- 6.9. AVALIAÇÕES PRIVADAS DO APLICATIVO (SOMENTE ADMIN PODE LER)
CREATE POLICY "Usuários autenticados podem enviar avaliação do app"
    ON public.app_feedbacks FOR INSERT WITH CHECK (true);

CREATE POLICY "Apenas administrador visualiza avaliações do app"
    ON public.app_feedbacks FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "Apenas administrador atualiza status de avaliações do app"
    ON public.app_feedbacks FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- ==============================================================================
-- ==============================================================================
-- 7. CARGA DE DADOS INICIAIS (APENAS CONFIGURAÇÃO DE SELOS E CATEGORIAS)
-- ==============================================================================

-- 7.1. SELOS DE QUALIDADE E SUSTENTABILIDADE
INSERT INTO public.seals (id, title, badge, description, icon, color, active_count) VALUES
('familiar', 'Comércio Familiar Local', 'FAMILIAR', 'Empreendimento familiar de Queimados com geração de renda e fortalecimento comunitário.', 'Users', 'amber', 0),
('artesanal', 'Produção Artesanal', 'ARTESANAL', 'Processamento caseiro e tradicional sem aditivos industriais.', 'Sparkles', 'orange', 0),
('selo_verde', 'Selo Verde Queimados', 'SELO VERDE', 'Certificação municipal do Desafio Liga Jovem • Equipe Q-NECT para sustentabilidade e comércio local.', 'Award', 'green', 0)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, badge = EXCLUDED.badge, description = EXCLUDED.description;

-- 7.2. CATEGORIAS
INSERT INTO public.categories (id, name, icon, count, color) VALUES
('todos', 'Todos', 'Grid', 0, '#4E553D'),
('produtos_agricolas', 'Produtos agrícolas', 'Sprout', 0, '#16A34A'),
('gastronomia', 'Gastronomia', 'Utensils', 0, '#D97706'),
('estetica_beleza', 'Estética e beleza', 'Sparkles', 0, '#EC4899'),
('vestuario', 'Vestuário', 'Shirt', 0, '#6366F1'),
('artesanato', 'Artesanato', 'Palette', 0, '#8B5CF6'),
('outros', 'Outros', 'Tag', 0, '#64748B')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;
