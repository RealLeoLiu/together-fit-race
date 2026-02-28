-- ==========================================
-- 1. 自动同步 Supabase Auth 到 public.users
-- ==========================================
-- 当新用户在 Supabase 注册时，自动向我们的 users 表插入一条记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器到 auth.users 表
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 2. 启用并重写所有表的 RLS (行级安全策略)
-- ==========================================

-- A. Users 表策略
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看用户信息（因为排行榜需要展示所有人）
DROP POLICY IF EXISTS "DEV: Allow public access on users" ON public.users;
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);

-- 只允许用户自己更新自己的信息 (例如修改名字或头像)
CREATE POLICY "Enable update for users based on id" ON public.users FOR UPDATE USING (auth.uid() = id);

-- B. Check-ins 表策略
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看所有打卡记录（排行榜、趋势图需要）
DROP POLICY IF EXISTS "DEV: Allow public access on check_ins" ON public.check_ins;
CREATE POLICY "Enable read access for all check_ins" ON public.check_ins FOR SELECT USING (true);

-- 核心：只允许用户插入/更新【自己】的打卡记录
CREATE POLICY "Enable insert for authenticated users only" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users based on user_id" ON public.check_ins FOR UPDATE USING (auth.uid() = user_id);

-- C. Goals 表策略
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看所有人的目标（排行榜、趋势图需要）
DROP POLICY IF EXISTS "DEV: Allow public access on goals" ON public.goals;
CREATE POLICY "Enable read access for all goals" ON public.goals FOR SELECT USING (true);

-- 核心：只允许用户插入/更新【自己】的目标体重
CREATE POLICY "Enable insert for goals based on user_id" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for goals based on user_id" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
