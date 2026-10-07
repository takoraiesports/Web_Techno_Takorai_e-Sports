-- ===================================================
-- Techno Takorai e-Sports - Supabase Database Schema
-- ===================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Users & Authentication Tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS student_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    university_email VARCHAR(255),
    faculty VARCHAR(255),
    department VARCHAR(255),
    year INT DEFAULT 1,
    student_status VARCHAR(50) DEFAULT 'ACTIVE',
    student_card_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    reject_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS gamer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    in_game_name VARCHAR(255),
    primary_game VARCHAR(255),
    rank VARCHAR(100),
    bio TEXT,
    discord_tag VARCHAR(100),
    twitch_url TEXT,
    youtube_url TEXT,
    matches_played INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    win_rate NUMERIC(5,2) DEFAULT 0,
    championships INT DEFAULT 0,
    mvp_count INT DEFAULT 0,
    elo_rating INT DEFAULT 1200,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Roles & Permissions (ADMIN, MEMBER)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Seed Default Roles
INSERT INTO roles (id, name, description) VALUES 
(1, 'ADMIN', 'System Administrator with full access'),
(2, 'MEMBER', 'Standard Club Member and Player')
ON CONFLICT (id) DO NOTHING;

-- 4. Games
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    publisher VARCHAR(255),
    category VARCHAR(100),
    platform VARCHAR(100) DEFAULT 'PC',
    banner_url TEXT,
    logo_url TEXT,
    team_size_min INT DEFAULT 1,
    team_size_max INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Seed Default Games
INSERT INTO games (id, name, slug, category, team_size_min, team_size_max) VALUES
('a0000000-0000-0000-0000-000000000001', 'VALORANT', 'valorant', 'FPS', 5, 5),
('a0000000-0000-0000-0000-000000000002', 'ROV (Realm of Valor)', 'rov', 'MOBA', 5, 5),
('a0000000-0000-0000-0000-000000000003', 'League of Legends', 'lol', 'MOBA', 5, 5),
('a0000000-0000-0000-0000-000000000004', 'FC 24 / EA FC', 'eafc', 'SPORTS', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- 5. Teams & Members
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    captain_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    rating INT DEFAULT 1200,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    championships INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MAIN_PLAYER',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 6. Tournaments & Registrations
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    rules TEXT,
    banner_url TEXT,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    format VARCHAR(50) DEFAULT 'SINGLE_ELIMINATION',
    max_teams INT DEFAULT 16,
    prize_pool VARCHAR(255),
    registration_start TIMESTAMP WITH TIME ZONE,
    registration_end TIMESTAMP WITH TIME ZONE,
    tournament_start TIMESTAMP WITH TIME ZONE,
    tournament_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'REGISTRATION_OPEN',
    seeding_type VARCHAR(50) DEFAULT 'RANDOM',
    seed_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    captain_id UUID REFERENCES users(id) ON DELETE SET NULL,
    roster TEXT,
    seed INT,
    status VARCHAR(50) DEFAULT 'PENDING',
    reject_reason TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 7. Matches & Disputes
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    stage VARCHAR(50) DEFAULT 'PLAYOFF',
    group_name VARCHAR(50),
    round INT NOT NULL,
    match_number INT NOT NULL,
    match_type VARCHAR(20) DEFAULT 'BO1',
    team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    score_team1 INT DEFAULT 0,
    score_team2 INT DEFAULT 0,
    winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    stream_url TEXT,
    vod_url TEXT,
    evidence_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 8. News CMS
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    category VARCHAR(100),
    tags VARCHAR(255),
    cover_url TEXT,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PUBLISHED',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 9. Store Products & Variants (S–5XL)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    sku VARCHAR(100) UNIQUE NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    stock INT DEFAULT 0,
    color VARCHAR(100),
    has_sizes BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(20) NOT NULL,
    color VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 10. Store Orders & Items
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_slip_url TEXT,
    delivery_method VARCHAR(50) DEFAULT 'SHIPPING',
    shipping_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(10,2) NOT NULL,
    size VARCHAR(20),
    color VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Seed Sample Products (Shirts with Sizes S-5XL)
INSERT INTO products (id, name, slug, subtitle, description, category, sku, price, image_url, stock, has_sizes) VALUES
('b0000000-0000-0000-0000-000000000001', 'เสื้อชมรม Techno Takorai Pro Jersey 2026', 'techno-takorai-pro-jersey-2026', 'เสื้อเเข่งสโมสรเทคโนตะโกราย', 'เสื้อเเข่งสโมสรเทคโนตะโกราย เนื้อผ้า Dry-Fit ซับเหงื่อได้ดีเยี่ยม ปักโลโก้ชมรม', 'Apparel', 'TS-JERSEY-01', 450.00, '/product/jk01.png', 100, TRUE),
('b0000000-0000-0000-0000-000000000002', 'เสื้อยืดสโมสร Takorai Casual Tee', 'takorai-casual-tee', 'เสื้อยืดลำลอง Cotton 100%', 'เสื้อยืดสโมสรผ้านุ่มใส่สบาย มีไซส์ S-5XL (2XL ขึ้นไป +50฿)', 'Apparel', 'TS-TEE-01', 350.00, '/product/k01.png', 150, TRUE),
('b0000000-0000-0000-0000-000000000003', 'พวงกุญแจ อะคริลิก Takorai Club', 'takorai-keychain-acrylic', 'พวงกุญแจโลโก้สโมสร', 'พวงกุญแจอะคริลิกใสด้าน พิมพ์ลาย HD', 'Accessories', 'TS-ACC-01', 99.00, '/product/p01.png', 200, FALSE)
ON CONFLICT (id) DO NOTHING;
