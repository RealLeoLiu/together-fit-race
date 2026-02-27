/**
 * TogetherFit Race — 数据库类型定义
 * 与 database.sql 中的表结构一一对应
 */

export interface User {
    id: string;
    name: string;
    avatar_url: string | null;
    gender: "male" | "female" | "other" | null;
    age: number | null;
    created_at: string;
}

export interface Goal {
    id: string;
    user_id: string;
    current_weight: number;
    goal_weight: number;
    updated_at: string;
}

export interface CheckIn {
    id: string;
    user_id: string;
    record_date: string;
    record_weight: number;
}

/** 排行榜中每个玩家的聚合数据 */
export interface LeaderboardPlayer {
    userId: string;
    name: string;
    emoji: string;
    avatar_url: string | null;
    startWeight: number;
    currentWeight: number;
    goalWeight: number;
    progressPct: number;
}
