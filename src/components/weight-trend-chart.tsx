"use client";

import type { CheckIn } from "@/lib/types";
import { TrendingUp } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
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
// 图表数据点类型
// ──────────────────────────────────────
interface TrendDataPoint {
    date: string;
    weight: number;
}

// ──────────────────────────────────────
// Props
// ──────────────────────────────────────
interface WeightTrendChartProps {
    checkIns: CheckIn[];
    isLoading: boolean;
}

// ──────────────────────────────────────
// 自定义 Tooltip
// ──────────────────────────────────────
function CustomTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { value: number; payload: TrendDataPoint }[];
    label?: string;
}) {
    if (!active || !payload || payload.length === 0) return null;

    const point = payload[0];
    return (
        <div className="rounded-2xl bg-white/95 backdrop-blur-sm border border-purple-100
                        px-4 py-2.5 shadow-lg shadow-purple-500/10">
            <p className="text-xs text-gray-400 font-medium mb-0.5">
                {point.payload.date}
            </p>
            <p className="text-lg font-extrabold text-purple-600">
                {point.value} <span className="text-xs font-semibold text-gray-400">kg</span>
            </p>
        </div>
    );
}

// ──────────────────────────────────────
// WeightTrendChart 组件
// ──────────────────────────────────────
export function WeightTrendChart({ checkIns, isLoading }: WeightTrendChartProps) {
    // 将 CheckIn[] 转为图表数据（已按 record_date ASC 排序）
    const data: TrendDataPoint[] = checkIns.map((c) => ({
        date: formatDateLabel(c.record_date),
        weight: Number(c.record_weight),
    }));

    // 计算 Y 轴域：上下各留 1kg 的 padding
    const weights = data.map((d) => d.weight);
    const yMin = weights.length > 0 ? Math.floor(Math.min(...weights) - 1) : 0;
    const yMax = weights.length > 0 ? Math.ceil(Math.max(...weights) + 1) : 100;

    // 空状态 / 加载态
    const showEmpty = !isLoading && data.length <= 1;

    return (
        <section className="mx-5 mt-5 mb-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100/80">
            {/* 标题行 */}
            <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-700">体重趋势</h2>
            </div>

            {/* 加载中 */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-500
                                    rounded-full animate-spin" />
                </div>
            )}

            {/* 空状态 */}
            {showEmpty && (
                <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-gray-400 font-semibold text-center">
                        继续打卡，解锁你的专属多巴胺趋势曲线 ✨
                    </p>
                </div>
            )}

            {/* 图表 */}
            {!isLoading && data.length >= 2 && (
                <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                        >
                            {/* 渐变定义 */}
                            <defs>
                                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>

                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#b0b0b0", fontWeight: 500 }}
                                dy={8}
                            />
                            <YAxis
                                domain={[yMin, yMax]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#b0b0b0", fontWeight: 500 }}
                                dx={-4}
                                tickCount={5}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{
                                    stroke: "#c4b5fd",
                                    strokeWidth: 1,
                                    strokeDasharray: "4 4",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="weight"
                                stroke="#8b5cf6"
                                strokeWidth={2.5}
                                fill="url(#trendFill)"
                                dot={{
                                    r: 4,
                                    fill: "#ffffff",
                                    stroke: "#8b5cf6",
                                    strokeWidth: 2,
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: "#8b5cf6",
                                    stroke: "#ffffff",
                                    strokeWidth: 2.5,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}
