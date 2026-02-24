"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Scale, Trophy, Flame, Sparkles, Crown } from "lucide-react";

// ──────────────────────────────────────
// Mock Data（后续会替换为 Supabase 数据）
// ──────────────────────────────────────
interface Player {
  name: string;
  emoji: string;
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
}

const MOCK_PLAYERS: Player[] = [
  { name: "你", emoji: "🧑", startWeight: 80, currentWeight: 76.5, goalWeight: 72 },
  { name: "小美", emoji: "👩", startWeight: 62, currentWeight: 59.8, goalWeight: 55 },
  { name: "阿杰", emoji: "🧔", startWeight: 90, currentWeight: 85.2, goalWeight: 78 },
  { name: "小雨", emoji: "👧", startWeight: 58, currentWeight: 56.1, goalWeight: 52 },
];

// 排行榜色板：第 1 名特殊金橙色，其余交替使用多巴胺色系
const LEADERBOARD_COLORS = [
  { bar: "bg-gradient-to-r from-amber-300 to-orange-400", track: "bg-amber-100" },
  { bar: "bg-mint", track: "bg-mint-light" },
  { bar: "bg-macaron-pink", track: "bg-macaron-pink-light" },
  { bar: "bg-[#89CFF0]", track: "bg-[#D6EFFF]" },
] as const;

function getProgress(start: number, current: number, goal: number): number {
  if (start === goal) return 100;
  const pct = ((start - current) / (start - goal)) * 100;
  return Math.min(Math.max(Math.round(pct), 0), 100);
}

// ──────────────────────────────────────
// Header
// ──────────────────────────────────────
function Header() {
  return (
    <header className="pt-10 pb-2 px-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <Sparkles className="w-6 h-6 text-cream-yellow" />
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
          TogetherFit Race
        </h1>
        <Sparkles className="w-6 h-6 text-cream-yellow" />
      </div>
      <p className="text-sm text-gray-400 font-semibold">
        多人减脂马拉松 · 一起变更好 💪
      </p>
    </header>
  );
}

// ──────────────────────────────────────
// 打卡区 (Check-in Card)
// ──────────────────────────────────────
function CheckInCard() {
  return (
    <section className="mx-5 mt-6 p-6 bg-white rounded-3xl shadow-sm border border-gray-100/80">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-2xl bg-mint-light flex items-center justify-center">
          <Scale className="w-5 h-5 text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-700">今日打卡</h2>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            type="number"
            placeholder="输入今日体重 (kg)"
            step="0.1"
            className="h-13 text-base rounded-2xl bg-gray-50/80 border-gray-200/60
                       placeholder:text-gray-300 focus:bg-white focus:border-mint
                       transition-all duration-200 pl-4 pr-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-300 font-semibold">
            kg
          </span>
        </div>

        <Button
          className="w-full h-13 rounded-full text-base font-bold
                     bg-gradient-to-r from-[#A8E6CF] to-[#7ECBAA]
                     hover:from-[#96DFC0] hover:to-[#6BBF9E]
                     text-white shadow-md shadow-mint/30
                     transition-all duration-300 active:scale-[0.98]"
        >
          <Flame className="w-5 h-5 mr-2" />
          今日打卡
        </Button>
      </div>
    </section>
  );
}

// ──────────────────────────────────────
// 排行榜 (Leaderboard)
// ──────────────────────────────────────
function Leaderboard() {
  // 按进度降序排列
  const ranked = [...MOCK_PLAYERS]
    .map((p) => ({ ...p, pct: getProgress(p.startWeight, p.currentWeight, p.goalWeight) }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <section className="mx-5 mt-5 mb-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100/80">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-2xl bg-macaron-pink-light flex items-center justify-center">
          <Trophy className="w-5 h-5 text-pink-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-700">排行榜</h2>
      </div>

      <div className="space-y-5">
        {ranked.map((player, idx) => {
          const colors = LEADERBOARD_COLORS[idx % LEADERBOARD_COLORS.length];
          const isFirst = idx === 0;

          return (
            <div
              key={player.name}
              className={`space-y-2 rounded-2xl p-3 transition-all duration-300 ${isFirst
                  ? "bg-gradient-to-br from-amber-50/80 to-orange-50/60 ring-1 ring-amber-200/50"
                  : "hover:bg-gray-50/50"
                }`}
            >
              {/* 名次 + 信息行 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* 名次徽章 */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold ${isFirst
                        ? "bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-sm shadow-amber-300/40"
                        : "bg-gray-100 text-gray-400"
                      }`}
                  >
                    {isFirst ? (
                      <Crown className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className="text-xl">{player.emoji}</span>
                  <span className="font-bold text-gray-700 text-sm">
                    {player.name}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-xl font-extrabold ${isFirst ? "text-amber-600" : "text-gray-800"
                      }`}
                  >
                    {player.currentWeight}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">
                    / {player.goalWeight} kg
                  </span>
                </div>
              </div>

              {/* 进度条 */}
              <div className="relative">
                <Progress
                  value={player.pct}
                  className={`h-3.5 ${colors.track} rounded-full`}
                  indicatorClassName={`${colors.bar} rounded-full`}
                />
                <span
                  className={`absolute right-0 -top-0.5 text-xs font-bold ${isFirst ? "text-amber-500" : "text-gray-400"
                    }`}
                >
                  {player.pct}%
                </span>
              </div>

              {/* 减重数据 */}
              <p className="text-xs text-gray-400 font-medium">
                已减{" "}
                <span className="text-gray-600 font-bold">
                  {(player.startWeight - player.currentWeight).toFixed(1)}
                </span>{" "}
                kg · 还需减{" "}
                <span className="text-gray-600 font-bold">
                  {(player.currentWeight - player.goalWeight).toFixed(1)}
                </span>{" "}
                kg
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ──────────────────────────────────────
// 主页
// ──────────────────────────────────────
export default function Home() {
  return (
    <div className="pb-6">
      <Header />
      <CheckInCard />
      <Leaderboard />
    </div>
  );
}
