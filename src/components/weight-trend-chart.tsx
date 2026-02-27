import type { CheckIn, User } from "@/lib/types";
import { TrendingUp } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid,
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
export function WeightTrendChart({ checkIns, users, isLoading }: WeightTrendChartProps) {
    // 1. 数据重组：按日期分组
    // 目标格式: [ { date: '02/27', 'User A': 70, 'User B': 80 }, ... ]
    const dataMap: Record<string, any> = {};

    // 获取所有涉及的日期并排序
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

    // 2. 计算 Y 轴域
    const weights = checkIns.map(c => Number(c.record_weight));
    const yMin = weights.length > 0 ? Math.floor(Math.min(...weights) - 2) : 0;
    const yMax = weights.length > 0 ? Math.ceil(Math.max(...weights) + 2) : 100;

    // 3. 过滤出有数据的用户
    const activeUsers = users.filter(u =>
        checkIns.some(c => c.user_id === u.id)
    );

    const showEmpty = !isLoading && chartData.length === 0;

    return (
        <section className="mx-5 mt-5 mb-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100/80">
            {/* 标题行 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-700">多人竞速趋势</h2>
                </div>
            </div>

            {/* 加载中 */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-500
                                    rounded-full animate-spin" />
                </div>
            )}

            {/* 空状态 */}
            {showEmpty && (
                <div className="flex flex-col items-center justify-center py-12 px-4 italic">
                    <p className="text-4xl mb-3">🏁</p>
                    <p className="text-sm text-gray-400 font-semibold text-center leading-relaxed">
                        还没有打卡数据，快去提交体重<br />开启多人同框竞速吧！
                    </p>
                </div>
            )}

            {/* 图表 */}
            {!isLoading && chartData.length > 0 && (
                <div className="w-full h-72 -ml-4">
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
                            {activeUsers.map((user, idx) => (
                                <Line
                                    key={user.id}
                                    type="monotone"
                                    dataKey={user.name}
                                    name={user.name}
                                    stroke={USER_COLORS[idx % USER_COLORS.length]}
                                    strokeWidth={3}
                                    dot={{
                                        r: 4,
                                        strokeWidth: 2,
                                        fill: "#fff"
                                    }}
                                    activeDot={{
                                        r: 6,
                                        strokeWidth: 0,
                                        fill: USER_COLORS[idx % USER_COLORS.length]
                                    }}
                                    connectNulls={true}
                                    animationDuration={1500}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

