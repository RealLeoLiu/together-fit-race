import { createClient } from "@/lib/supabase/server";
import type { LeaderboardPlayer, User } from "@/lib/types";
import { HomeClient } from "@/components/home-client";


// 头像 Emoji 池，按顺序分配
const EMOJI_POOL = ["🧑", "👩", "🧔", "👧", "🐻", "🐰", "🦊", "🐱"];

function getProgress(start: number, current: number, goal: number): number {
  if (start === goal) return 100;
  const pct = ((start - current) / (start - goal)) * 100;
  return Math.min(Math.max(Math.round(pct), 0), 100);
}

async function fetchLeaderboard(supabase: any): Promise<LeaderboardPlayer[]> {
  // 1. 获取所有用户
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .order("created_at", { ascending: true });

  if (usersErr) throw new Error(`获取用户失败: ${usersErr.message}`);
  if (!users || users.length === 0) return [];

  // 2. 获取所有 goals 和最新 check_ins
  const userIds = users.map((u: Pick<User, "id">) => u.id);

  const [goalsRes, checkInsRes] = await Promise.all([
    supabase.from("goals").select("*").in("user_id", userIds),
    supabase
      .from("check_ins")
      .select("*")
      .in("user_id", userIds)
      .order("record_date", { ascending: false }),
  ]);

  if (goalsRes.error) throw new Error(`获取目标失败: ${goalsRes.error.message}`);
  if (checkInsRes.error) throw new Error(`获取打卡失败: ${checkInsRes.error.message}`);

  const goals = goalsRes.data ?? [];
  const checkIns = checkInsRes.data ?? [];

  // 3. 组装排行榜
  const players: LeaderboardPlayer[] = users
    .map((user: Pick<User, "id" | "name" | "avatar_url">, idx: number) => {
      const goal = goals.find((g: { user_id: string }) => g.user_id === user.id);
      const latestCheckIn = checkIns.find((c: { user_id: string }) => c.user_id === user.id);

      if (!goal) return null;

      const startWeight = Number(goal.current_weight);
      const goalWeight = Number(goal.goal_weight);
      const currentWeight = latestCheckIn
        ? Number(latestCheckIn.record_weight)
        : startWeight;

      return {
        userId: user.id,
        name: user.name,
        avatar_url: user.avatar_url ?? null,
        emoji: EMOJI_POOL[idx % EMOJI_POOL.length],
        startWeight,
        currentWeight,
        goalWeight,
        progressPct: getProgress(startWeight, currentWeight, goalWeight),
      };
    })
    .filter((p: LeaderboardPlayer | null): p is LeaderboardPlayer => p !== null)
    .sort((a: LeaderboardPlayer, b: LeaderboardPlayer) => b.progressPct - a.progressPct);

  return players;
}

async function fetchUsers(supabase: any): Promise<Pick<User, "id" | "name" | "avatar_url">[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`获取用户列表失败: ${error.message}`);
  return data ?? [];
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  let players: LeaderboardPlayer[] = [];
  let users: Pick<User, "id" | "name" | "avatar_url">[] = [];
  let serverError: string | null = null;
  let currentUserProfile: Pick<User, "id" | "name" | "avatar_url"> | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: mappedUser } = await supabase
        .from("users")
        .select("id, name, avatar_url")
        .eq("auth_id", user.id)
        .single();
      if (mappedUser) {
        currentUserProfile = mappedUser;
      }
    }
    [players, users] = await Promise.all([fetchLeaderboard(supabase), fetchUsers(supabase)]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    serverError = message;
  }

  return (
    <HomeClient
      initialPlayers={players}
      initialUsers={users}
      serverError={serverError}
      currentUserProfile={currentUserProfile}
    />
  );
}
