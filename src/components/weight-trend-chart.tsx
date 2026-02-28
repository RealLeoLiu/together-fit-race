import { useState, useEffect } from "react";
import type { CheckIn, User, LeaderboardPlayer } from "@/lib/types";
import { TrendingUp, Check } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid,
    ReferenceLine
} from "recharts";

// ──────────────────────────────────────
// 工具函数：将 record_date 格式化为 MM/DD
// ──────────────────────────────────────
function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}`;
}

// ──────────────────────────────────────
// 图表颜色池
// ──────────────────────────────────────
const USER_COLORS = [
    "#8B5CF6", // Violet
    "#10B981", // Emerald
    "#F43F5E", // Rose
    "#0EA5E9", // Sky
    "#F59E0B", // Amber
    "#6366F1", // Indigo
];

// ──────────────────────────────────────
// Props
// ──────────────────────────────────────
interface WeightTrendChartProps {
    checkIns: CheckIn[];
    users: Pick<User, "id" | "name" | "avatar_url">[];
    players?: LeaderboardPlayer[]; // 传入 players 以获取 goalWeight
    isLoading: boolean;
}

// ──────────────────────────────────────
// 自定义 Tooltip
// ──────────────────────────────────────
function CustomTooltip({
    active,
    payload,
    label,
}: any) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="rounded-2xl bg-white/95 backdrop-blur-sm border border-gray-100
                        px-4 py-3 shadow-xl shadow-gray-200/50 min-w-[140px]">
            <p className="text-xs text-gray-400 font-bold mb-2 pb-1 border-b border-gray-50 uppercase tracking-wider">
                {label}
            </p>
            <div className="space-y-2">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-bold text-gray-600">{entry.name}</span>
                        </div>
                        <span className="text-sm font-extrabold text-gray-800">
                            {entry.value} <span className="text-[10px] text-gray-400">kg</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ──────────────────────────────────────
// WeightTrendChart 组件
// ──────────────────────────────────────
export function WeightTrendChart({ checkIns, users, players, isLoading }: WeightTrendChartProps) {
    // 找出所有有目标或有数据的活跃用户
    const activeUsers = users.filter(u =>
        checkIns.some(c => c.user_id === u.id) || players?.some(p => p.userId === u.id)
    );

    // 用户多选状态 (selectedUserIds)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // 初始化时，默认全选活跃用户
    useEffect(() => {
        if (activeUsers.length > 0 && selectedUsers.length === 0) {
            setSelectedUsers(activeUsers.map(u => u.id));
        }
    }, [activeUsers, selectedUsers.length]);

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId) // 允许全部取消，或者你可以控制最少留一个
                : [...prev, userId]
        );
    };

    // 1. 数据重组：按日期分组
    const dataMap: Record<string, any> = {};

    const dates = Array.from(new Set(checkIns.map(c => c.record_date))).sort();

    dates.forEach(dateStr => {
        const label = formatDateLabel(dateStr);
        dataMap[label] = { date: label };
    });

    checkIns.forEach(c => {
        const label = formatDateLabel(c.record_date);
        const user = users.find(u => u.id === c.user_id);
        if (user && dataMap[label]) {
            dataMap[label][user.name] = Number(c.record_weight);
        }
    });

    const chartData = Object.values(dataMap);

    // 2. 计算 Y 轴域 (包括所选用户的打卡数据 + 所选用户的目标体重)
    const activeWeights = checkIns
        .filter(c => selectedUsers.includes(c.user_id))
        .map(c => Number(c.record_weight));

    const activeGoals = (players || [])
        .filter(p => selectedUsers.includes(p.userId))
        .map(p => Number(p.goalWeight));

    const allValues = [...activeWeights, ...activeGoals];

    // 如果没有选中任何用户数据或目标，就用一个默认范围
    const yMin = allValues.length > 0 ? Math.floor(Math.min(...allValues) - 2) : 0;
    const yMax = allValues.length > 0 ? Math.ceil(Math.max(...allValues) + 2) : 100;

    const showEmpty = !isLoading && chartData.length === 0;

    return (
        <section className="mx-5 mt-5 mb-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100/80">
            {/* 标题行 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-700">多人竞速趋势</h2>
                </div>
            </div>

            {/* 用户筛选器 (Pill tags) */}
            {!isLoading && activeUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {activeUsers.map((user, idx) => {
                        const isSelected = selectedUsers.includes(user.id);
                        const color = USER_COLORS[idx % USER_COLORS.length];
                        return (
                            <button
                                key={user.id}
                                onClick={() => toggleUser(user.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-300 border
                                    ${isSelected
                                        ? "bg-white text-gray-800 shadow-sm"
                                        : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                                    }`}
                                style={{
                                    borderColor: isSelected ? color : "transparent"
                                }}
                            >
                                <div
                                    className="w-2.5 h-2.5 rounded-full transition-transform duration-300"
                                    style={{
                                        backgroundColor: isSelected ? color : "#cbd5e1",
                                        transform: isSelected ? "scale(1)" : "scale(0.8)"
                                    }}
                                />
                                {user.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* 加载中 */}
            {isLoading && (
                <div className="flex items-center justify-center py-20 min-h-[400px]">
                    <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-500
                                    rounded-full animate-spin" />
                </div>
            )}

            {/* 空状态 */}
            {showEmpty && (
                <div className="flex flex-col items-center justify-center py-12 px-4 italic min-h-[400px]">
                    <p className="text-4xl mb-3">🏁</p>
                    <p className="text-sm text-gray-400 font-semibold text-center leading-relaxed">
                        还没有打卡数据，快去提交体重<br />开启多人同框竞速吧！
                    </p>
                </div>
            )}

            {/* 图表: 扩容图表高度 min-h-[400px] */}
            {!isLoading && chartData.length > 0 && (
                <div className="w-full h-96 min-h-[400px] -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke="#f0f0f0"
                            />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                domain={[yMin, yMax]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                                tickCount={6}
                                hide={false}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{
                                    stroke: "#e2e8f0",
                                    strokeWidth: 2,
                                }}
                            />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                wrapperStyle={{
                                    paddingBottom: "20px",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    color: "#64748b"
                                }}
                            />
                            {/* 遍历 activeUsers，只有选中的才渲染 Line 和 ReferenceLine */}
                            {activeUsers.map((user, idx) => {
                                if (!selectedUsers.includes(user.id)) return null;
                                const player = players?.find(p => p.userId === user.id);
                                const color = USER_COLORS[idx % USER_COLORS.length];

                                return [
                                    <Line
                                        key={`line-${user.id}`}
                                        type="monotone"
                                        dataKey={user.name}
                                        name={user.name}
                                        stroke={color}
                                        strokeWidth={3}
                                        dot={{
                                            r: 4,
                                            strokeWidth: 2,
                                            fill: "#fff"
                                        }}
                                        activeDot={{
                                            r: 6,
                                            strokeWidth: 0,
                                            fill: color
                                        }}
                                        connectNulls={true}
                                        animationDuration={1000}
                                    />,
                                    /* 如果存在目标体重，则渲染虚线 */
                                    player?.goalWeight ? (
                                        <ReferenceLine
                                            key={`ref-${user.id}`}
                                            y={player.goalWeight}
                                            stroke={color}
                                            strokeDasharray="5 5"
                                            strokeOpacity={0.6}
                                            label={{
                                                position: "insideBottomLeft",
                                                value: `${user.name}的目标`,
                                                fill: color,
                                                fontSize: 10,
                                                fontWeight: "bold",
                                                opacity: 0.9
                                            }}
                                        />
                                    ) : null
                                ];
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}
