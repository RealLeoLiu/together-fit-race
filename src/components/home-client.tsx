"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
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
import { Scale, Trophy, Flame, Sparkles, Crown, Settings2, X, Target } from "lucide-react";
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
    currentUserProfile: Pick<User, "id" | "name" | "avatar_url"> | null;
}

// ──────────────────────────────────────
// Header
// ──────────────────────────────────────
function Header() {
    return (
        <header className="pt-10 pb-3 flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 mb-2">
                <img
                    src="/logo.png"
                    alt="TogetherFit Race Logo"
                    className="w-12 h-12 rounded-full shadow-md object-cover ring-2 ring-white/60"
                />
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
                    Fit Race
                </h1>
            </div>
            <p className="text-sm text-gray-400 font-semibold text-center">
                减脂马拉松 · 一起变更好 💪
            </p>
        </header>
    );
}

// ──────────────────────────────────────
// 个人目标设置弹窗 (Goal Setting Modal)
// ──────────────────────────────────────
function GoalSettingModal({
    isOpen,
    onClose,
    userId,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess: () => void;
}) {
    const supabase = createClient();
    const [initialWeight, setInitialWeight] = useState("");
    const [goalWeight, setGoalWeight] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const fetchGoal = async () => {
            setIsFetching(true);
            const { data, error } = await supabase
                .from("goals")
                .select("*")
                .eq("user_id", userId)
                .single();

            if (data) {
                setInitialWeight(String(data.current_weight));
                setGoalWeight(String(data.goal_weight));
            }
            setIsFetching(false);
        };
        fetchGoal();
    }, [isOpen, userId, supabase]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        const initial = Number(initialWeight);
        const goal = Number(goalWeight);

        if (isNaN(initial) || isNaN(goal) || initial <= 0 || goal <= 0) {
            toast.error("请输入有效的体重数值");
            return;
        }

        setIsLoading(true);
        try {
            // Check if goal exists since user_id might not have a UNIQUE constraint
            const { data: existingGoal } = await supabase
                .from("goals")
                .select("id")
                .eq("user_id", userId)
                .single();

            let targetError;

            if (existingGoal) {
                const { error } = await supabase
                    .from("goals")
                    .update({
                        current_weight: initial,
                        goal_weight: goal,
                        updated_at: new Date().toISOString()
                    })
                    .eq("user_id", userId);
                targetError = error;
            } else {
                const { error } = await supabase
                    .from("goals")
                    .insert({
                        user_id: userId,
                        current_weight: initial,
                        goal_weight: goal,
                    });
                targetError = error;
            }

            if (targetError) throw new Error(targetError.message);

            toast.success("目标设置成功！");
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "保存失败";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-[15vh] px-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                                <Target className="w-4 h-4 text-violet-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">设置减重目标</h3>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {isFetching ? (
                        <div className="py-8 text-center text-gray-400 text-sm animate-pulse">加载中...</div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wider">初始体重 (kg)</label>
                                <Input
                                    type="number"
                                    placeholder="85.0"
                                    step="0.01"
                                    value={initialWeight}
                                    onChange={e => setInitialWeight(e.target.value)}
                                    className="h-12 rounded-2xl bg-gray-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wider">目标体重 (kg)</label>
                                <Input
                                    type="number"
                                    placeholder="65.0"
                                    step="0.01"
                                    value={goalWeight}
                                    onChange={e => setGoalWeight(e.target.value)}
                                    className="h-12 rounded-2xl bg-gray-50/50"
                                />
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full h-12 mt-4 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200"
                            >
                                {isLoading ? "保存中..." : "保存目标"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────
// 个人名片 (User Profile Card)
// ──────────────────────────────────────
function UserProfileCard({
    user,
    onSignOut,
    onAvatarUpdated,
}: {
    user: Pick<User, "id" | "name" | "avatar_url"> | null;
    onSignOut: () => void;
    onAvatarUpdated: () => void;
}) {
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

    return (
        <section className="w-full bg-white rounded-3xl shadow-sm p-6 border border-gray-100/80">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative group flex-shrink-0 cursor-pointer w-14 h-14">
                            <AvatarUploader
                                userId={user.id}
                                currentAvatarUrl={user.avatar_url}
                                userName={user.name}
                                onAvatarUpdated={onAvatarUpdated}
                                sizeClass="w-full h-full"
                                textSizeClass="text-lg"
                                className="ring-2 ring-mint/20 group-hover:ring-violet-400 transition-all duration-300"
                            />
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-full shadow-sm bg-gradient-to-br from-mint-light to-emerald-100 flex items-center justify-center font-bold text-emerald-600 ring-2 ring-mint/10">
                            U
                        </div>
                    )}
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Welcome back</p>
                        <h2 className="text-lg font-bold text-gray-800 leading-tight">
                            Hi, {user?.name || "友人"}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {user && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsGoalModalOpen(true)}
                            className="w-9 h-9 rounded-full text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-all"
                            aria-label="设置目标"
                        >
                            <Settings2 className="w-4 h-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSignOut}
                        className="h-9 px-4 rounded-full text-xs text-gray-400 hover:text-red-400 hover:bg-red-50 transition-all font-semibold border border-transparent hover:border-red-100"
                    >
                        退出
                    </Button>
                </div>
            </div>

            {user && (
                <GoalSettingModal
                    isOpen={isGoalModalOpen}
                    onClose={() => setIsGoalModalOpen(false)}
                    userId={user.id}
                    onSuccess={onAvatarUpdated} // Reuse refresh trigger
                />
            )}
        </section>
    );
}

// ──────────────────────────────────────
// 连胜下降计算算法
// ──────────────────────────────────────
function calculateDropStreak(records: CheckIn[]): number {
    if (!records || records.length < 2) return 0;

    // Ensure sorted from newest to oldest
    const sorted = [...records].sort(
        (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    );

    let streak = 0;
    // Iterate and compare each record to the one before it (older record)
    for (let i = 0; i < sorted.length - 1; i++) {
        const newerWeight = Number(sorted[i].record_weight);
        const olderWeight = Number(sorted[i + 1].record_weight);

        if (newerWeight < olderWeight) {
            streak++;
        } else {
            break; // Stop climbing if we stagnated or gained weight
        }
    }
    return streak;
}

// ──────────────────────────────────────
// 打卡区 (Check-in Card)
// ──────────────────────────────────────
function CheckInCard({
    currentUserProfile,
    onCheckInSuccess,
}: {
    currentUserProfile: Pick<User, "id" | "name" | "avatar_url"> | null;
    onCheckInSuccess: () => void;
}) {
    const supabase = createClient();
    const [weight, setWeight] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCheckIn = useCallback(async () => {
        if (!currentUserProfile) {
            toast.error("您尚未登录或未绑定业务身份");
            return;
        }
        const weightNum = Number(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            toast.error("请输入有效的体重数值");
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("check_ins").upsert(
                {
                    user_id: currentUserProfile.id,
                    record_date: new Date().toISOString().split("T")[0],
                    record_weight: weightNum,
                },
                { onConflict: "user_id,record_date" }
            );

            if (error) throw new Error(error.message);

            // Fetch latest records to calculate streak
            const { data: recordsData, error: fetchError } = await supabase
                .from("check_ins")
                .select("*")
                .eq("user_id", currentUserProfile.id)
                .order("record_date", { ascending: false });

            if (!fetchError && recordsData) {
                const streak = calculateDropStreak(recordsData);
                if (streak >= 2) {
                    toast.success(`🎉 太棒了！你的体重已经连续下降 ${streak} 天了！继续保持！🔥`, {
                        duration: 5000,
                        className: "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200 text-amber-800 text-base font-bold shadow-lg"
                    });

                    // Trigger multi-burst dopamine confetti
                    const duration = 3000;
                    const end = Date.now() + duration;

                    const frame = () => {
                        confetti({
                            particleCount: 5,
                            angle: 60,
                            spread: 55,
                            origin: { x: 0 },
                            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
                        });
                        confetti({
                            particleCount: 5,
                            angle: 120,
                            spread: 55,
                            origin: { x: 1 },
                            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
                        });

                        if (Date.now() < end) {
                            requestAnimationFrame(frame);
                        }
                    };
                    frame();
                } else {
                    toast.success("打卡成功！继续加油 🎉");
                }
            } else {
                toast.success("打卡成功！继续加油 🎉");
            }

            setWeight("");
            onCheckInSuccess();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "打卡失败，请稍后重试";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, [currentUserProfile, weight, onCheckInSuccess]);

    return (
        <section className="w-full bg-white rounded-3xl shadow-sm p-6 border border-gray-100/80">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-2xl bg-mint-light flex items-center justify-center">
                    <Scale className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-700">今日打卡</h2>
            </div>

            <div className="space-y-5">
                {/* 体重输入 */}
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="输入今日体重 (kg)"
                        step="0.01"
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

    if (players.length === 0) {
        return (
            <section className="w-full bg-white rounded-3xl shadow-sm p-8 border border-gray-100/80 text-center">
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
        <section className="w-full bg-white rounded-3xl shadow-sm p-6 border border-gray-100/80">
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
                                    {player.avatar_url ? (
                                        <img
                                            src={player.avatar_url}
                                            alt={player.name}
                                            className="w-9 h-9 rounded-full shadow-sm object-cover ring-1 ring-white"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full shadow-sm bg-gray-100 flex items-center justify-center font-bold text-gray-400 ring-1 ring-white">
                                            {player.emoji}
                                        </div>
                                    )}
                                    <span className="font-bold text-gray-700 text-sm ml-1 truncate">
                                        {player.name}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span
                                        className={`text-xl font-extrabold ${isFirst ? "text-amber-600" : "text-gray-800"
                                            }`}
                                    >
                                        {(player.currentWeight * 2).toFixed(2)}
                                    </span>
                                    <span className="text-xs text-gray-400 font-semibold">
                                        / {(player.goalWeight * 2).toFixed(2)} 斤
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
                                    {((player.startWeight - player.currentWeight) * 2).toFixed(2)}
                                </span>{" "}
                                斤 · 还需减{" "}
                                <span className="text-gray-600 font-bold">
                                    {((player.currentWeight - player.goalWeight) * 2).toFixed(2)}
                                </span>{" "}
                                斤
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
    currentUserProfile,
}: HomeClientProps) {
    const router = useRouter();
    const supabase = createClient();

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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh(); // Middleware will redirect to login
    };

    return (
        <div className="pb-10 flex flex-col gap-6 px-5">
            <Header />

            <UserProfileCard
                user={currentUserProfile}
                onSignOut={handleSignOut}
                onAvatarUpdated={() => router.refresh()}
            />

            <CheckInCard
                currentUserProfile={currentUserProfile}
                onCheckInSuccess={handleCheckInSuccess}
            />

            <Leaderboard players={initialPlayers} />

            <WeightTrendChart
                checkIns={trendData}
                users={initialUsers}
                players={initialPlayers}
                isLoading={isLoadingTrend}
            />
        </div>
    );
}
