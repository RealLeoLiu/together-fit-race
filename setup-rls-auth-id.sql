-- 1. 确保 check_ins 表开启了 RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- 2. 允许所有人查看所有的打卡记录（趋势图需要拉取所有人数据比较）
DROP POLICY IF EXISTS "Enable read access for all users" ON public.check_ins;
CREATE POLICY "Enable read access for all users" ON public.check_ins FOR SELECT USING (true);

-- 3. 核心写入防御：当你向 check_ins 表 INSERT 数据时，
-- 我们通过你要写入的 user_id 去 users 表里查这个 user_id 对应的 auth_id。
-- 如果查出来的 auth_id 不等于当前真正登录的 auth.uid()，数据库就会直接拒绝！
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.check_ins;
CREATE POLICY "Enable insert for authenticated users only" ON public.check_ins 
FOR INSERT WITH CHECK (
  (SELECT auth_id FROM public.users WHERE public.users.id = check_ins.user_id) = auth.uid()
);

-- 4. 核心修改防御：同上，防止越权修改（如果后续需要编辑记录）
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.check_ins;
CREATE POLICY "Enable update for users based on user_id" ON public.check_ins 
FOR UPDATE USING (
  (SELECT auth_id FROM public.users WHERE public.users.id = check_ins.user_id) = auth.uid()
);

-- ==========================================
-- (可选) 如果你的目标体重表 `goals` 也需要同样的保护，可执行以下代码：
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all goals" ON public.goals;
CREATE POLICY "Enable read access for all goals" ON public.goals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for goals based on user_id" ON public.goals;
CREATE POLICY "Enable insert for goals based on user_id" ON public.goals 
FOR INSERT WITH CHECK (
  (SELECT auth_id FROM public.users WHERE public.users.id = goals.user_id) = auth.uid()
);

DROP POLICY IF EXISTS "Enable update for goals based on user_id" ON public.goals;
CREATE POLICY "Enable update for goals based on user_id" ON public.goals 
FOR UPDATE USING (
  (SELECT auth_id FROM public.users WHERE public.users.id = goals.user_id) = auth.uid()
);
