"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { LeaderboardPlayer, User, CheckIn } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Scale, Trophy, Flame, Sparkles, Crown } from "lucide-react";
import { WeightTrendChart } from "@/components/weight-trend-chart";
import { AvatarUploader } from "@/components/avatar-uploader";

// ──────────────────────────────────────
// 排行榜色板
// ──────────────────────────────────────
const LEADERBOARD_COLORS = [
    { bar: "bg-gradient-to-r from-amber-300 to-orange-400", track: "bg-amber-100" },
    { bar: "bg-mint", track: "bg-mint-light" },
    { bar: "bg-macaron-pink", track: "bg-macaron-pink-light" },
    { bar: "bg-[#89CFF0]", track: "bg-[#D6EFFF]" },
] as const;

// ──────────────────────────────────────
// Props
// ──────────────────────────────────────
interface HomeClientProps {
    initialPlayers: LeaderboardPlayer[];
    initialUsers: Pick<User, "id" | "name" | "avatar_url">[];
    serverError: string | null;
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
function CheckInCard({
    users,
    selectedUserId,
    onUserChange,
    onCheckInSuccess,
}: {
    users: Pick<User, "id" | "name" | "avatar_url">[];
    selectedUserId: string;
    onUserChange: (userId: string) => void;
    onCheckInSuccess: () => void;
}) {
    const [weight, setWeight] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCheckIn = useCallback(async () => {
        if (!selectedUserId) {
            toast.error("请先选择打卡用户");
            return;
        }
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            toast.error("请输入有效的体重数值");
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("check_ins").upsert(
                {
                    user_id: selectedUserId,
                    record_date: new Date().toISOString().split("T")[0],
                    record_weight: weightNum,
                },
                { onConflict: "user_id,record_date" }
            );

            if (error) throw new Error(error.message);

            toast.success("打卡成功！继续加油 🎉");
            setWeight("");
            onCheckInSuccess();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "打卡失败，请稍后重试";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedUserId, weight, onCheckInSuccess]);

    return (
        <section className="mx-5 mt-6 p-6 bg-white rounded-3xl shadow-sm border border-gray-100/80">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-2xl bg-mint-light flex items-center justify-center">
                    <Scale className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-700">今日打卡</h2>
            </div>

            <div className="space-y-4">
                {/* 用户选择 */}
                <Select value={selectedUserId} onValueChange={onUserChange}>
                    <SelectTrigger className="h-12 rounded-2xl bg-gray-50/80 border-gray-200/60">
                        <SelectValue placeholder="选择打卡用户..." />
                    </SelectTrigger>
                    <SelectContent>
                        {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                                {u.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* 体重输入 */}
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="输入今日体重 (kg)"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="h-13 text-base rounded-2xl bg-gray-50/80 border-gray-200/60
                       placeholder:text-gray-300 focus:bg-white focus:border-mint
                       transition-all duration-200 pl-4 pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-300 font-semibold">
                        kg
                    </span>
                </div>

                {/* 打卡按钮 */}
                <Button
                    onClick={handleCheckIn}
                    disabled={isSubmitting}
                    className="w-full h-13 rounded-full text-base font-bold
                     bg-gradient-to-r from-[#A8E6CF] to-[#7ECBAA]
                     hover:from-[#96DFC0] hover:to-[#6BBF9E]
                     text-white shadow-md shadow-mint/30
                     transition-all duration-300 active:scale-[0.98]
                     disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Flame className="w-5 h-5 mr-2" />
                    {isSubmitting ? "提交中..." : "今日打卡"}
                </Button>
            </div>
        </section>
    );
}

// ──────────────────────────────────────
// 排行榜 (Leaderboard)
// ──────────────────────────────────────
function Leaderboard({ players }: { players: LeaderboardPlayer[] }) {
    const [localAvatars, setLocalAvatars] = useState<Record<string, string>>({});

    const handleAvatarUpdated = (userId: string, newUrl: string) => {
        setLocalAvatars(prev => ({ ...prev, [userId]: newUrl }));
    };

    if (players.length === 0) {
        return (
            <section className="mx-5 mt-5 mb-8 p-8 bg-white rounded-3xl shadow-sm border border-gray-100/80 text-center">
                <div className="flex items-center justify-center gap-2 mb-5">
                    <div className="w-9 h-9 rounded-2xl bg-macaron-pink-light flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-pink-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-700">排行榜</h2>
                </div>
                <div className="py-6">
                    <p className="text-4xl mb-3">🏜️</p>
                    <p className="text-gray-400 font-semibold text-sm">
                        排行榜空空如也，快去添加用户吧
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="mx-5 mt-5 mb-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100/80">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-2xl bg-macaron-pink-light flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-pink-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-700">排行榜</h2>
            </div>

            <div className="space-y-4">
                {players.map((player, idx) => {
                    const colors = LEADERBOARD_COLORS[idx % LEADERBOARD_COLORS.length];
                    const isFirst = idx === 0;

                    return (
                        <div
                            key={player.userId}
                            className={`space-y-2 rounded-2xl p-3 transition-all duration-300 ${isFirst
                                ? "bg-gradient-to-br from-amber-50/80 to-orange-50/60 ring-1 ring-amber-200/50"
                                : "hover:bg-gray-50/50"
                                }`}
                        >
                            {/* 名次 + 信息行 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${isFirst
                                            ? "bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-sm shadow-amber-300/40"
                                            : "bg-gray-100 text-gray-400"
                                            }`}
                                    >
                                        {isFirst ? <Crown className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <AvatarUploader
                                        userId={player.userId}
                                        currentAvatarUrl={localAvatars[player.userId] ?? player.avatar_url}
                                        userName={player.emoji}
                                        onAvatarUpdated={(newUrl) => handleAvatarUpdated(player.userId, newUrl)}
                                    />
                                    <span className="font-bold text-gray-700 text-sm ml-1 truncate">
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
                                    value={player.progressPct}
                                    className={`h-3.5 ${colors.track} rounded-full`}
                                    indicatorClassName={`${colors.bar} rounded-full`}
                                />
                                <span
                                    className={`absolute right-0 -top-0.5 text-xs font-bold ${isFirst ? "text-amber-500" : "text-gray-400"
                                        }`}
                                >
                                    {player.progressPct}%
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
// HomeClient（主入口）
// ──────────────────────────────────────
export function HomeClient({
    initialPlayers,
    initialUsers,
    serverError,
}: HomeClientProps) {
    const router = useRouter();

    // ── 提升的用户选择状态 ──
    const [selectedUserId, setSelectedUserId] = useState("");

    // ── 趋势图数据 ──
    const [trendData, setTrendData] = useState<CheckIn[]>([]);
    const [isLoadingTrend, setIsLoadingTrend] = useState(false);

    // 加载全部历史打卡用于“竞速趋势图”
    const fetchAllTrends = useCallback(async () => {
        setIsLoadingTrend(true);
        try {
            const { data, error } = await supabase
                .from("check_ins")
                .select("*")
                .order("record_date", { ascending: true });

            if (error) throw new Error(error.message);
            setTrendData(data ?? []);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "获取竞速数据失败";
            toast.error(message);
        } finally {
            setIsLoadingTrend(false);
        }
    }, []);

    useEffect(() => {
        fetchAllTrends();
    }, [fetchAllTrends]);

    // 服务端错误在首次渲染时通过 toast 展示
    useEffect(() => {
        if (serverError) {
            toast.error(serverError);
        }
    }, [serverError]);

    // ── 联级刷新 ──
    const handleCheckInSuccess = useCallback(() => {
        // 通过 router.refresh() 触发 Server Component 重新获取数据
        router.refresh();
        // 刷新竞速趋势图
        fetchAllTrends();
    }, [router, fetchAllTrends]);

    return (
        <div className="pb-6">
            <Header />
            <CheckInCard
                users={initialUsers}
                selectedUserId={selectedUserId}
                onUserChange={setSelectedUserId}
                onCheckInSuccess={handleCheckInSuccess}
            />
            <Leaderboard players={initialPlayers} />
            <WeightTrendChart
                checkIns={trendData}
                users={initialUsers}
                isLoading={isLoadingTrend}
            />
        </div>
    );
}
