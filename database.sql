-- ============================================================
-- TogetherFit Race — 数据库建表 SQL
-- 适用于 Supabase (PostgreSQL)
-- ============================================================

-- ──────────────────────────────────────
-- 1. users 表：用户基础信息
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  avatar_url  TEXT,
  gender      TEXT        CHECK (gender IN ('male', 'female', 'other')),
  age         SMALLINT    CHECK (age > 0 AND age < 200),
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ⚠️ 开发环境临时策略：允许匿名读写，正式上线前必须替换为基于 Auth 的安全策略
CREATE POLICY "DEV: Allow public access on users"
  ON users FOR ALL USING (true);

-- ──────────────────────────────────────
-- 2. goals 表：减脂目标
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  current_weight  NUMERIC(5,1) NOT NULL CHECK (current_weight > 0),
  goal_weight     NUMERIC(5,1) NOT NULL CHECK (goal_weight > 0),
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- ⚠️ 开发环境临时策略：允许匿名读写，正式上线前必须替换为基于 Auth 的安全策略
CREATE POLICY "DEV: Allow public access on goals"
  ON goals FOR ALL USING (true);

-- ──────────────────────────────────────
-- 3. check_ins 表：每日打卡记录
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS check_ins (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  record_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  record_weight   NUMERIC(5,1) NOT NULL CHECK (record_weight > 0),

  -- 同一用户同一天只能打一次卡
  UNIQUE (user_id, record_date)
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- ⚠️ 开发环境临时策略：允许匿名读写，正式上线前必须替换为基于 Auth 的安全策略
CREATE POLICY "DEV: Allow public access on check_ins"
  ON check_ins FOR ALL USING (true);
