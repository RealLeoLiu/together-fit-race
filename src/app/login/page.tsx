"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isSignUp) {
                if (!name.trim()) {
                    toast.error("请输入昵称");
                    setIsLoading(false);
                    return;
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                        },
                    },
                });
                if (error) throw error;
                toast.success("注册成功！正在为您登录...");
                router.push("/");
                router.refresh(); // Force a refresh to update the server session
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("欢迎回来！");
                router.push("/");
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || "发生错误，请重试");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-orange-50/30 flex justify-center items-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-br from-orange-400 to-pink-500 bg-clip-text text-transparent mb-2">
                        TogetherFit Race
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isSignUp ? "创建你的专属账号开启自律之旅" : "登入你的账号，继续减脂竞速"}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">昵称</label>
                            <Input
                                type="text"
                                placeholder="例如: Leo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-white/50 border-gray-100 rounded-2xl h-12 px-4 focus:ring-orange-500/50"
                                required={isSignUp}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">邮箱</label>
                        <Input
                            type="email"
                            placeholder="hello@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-white/50 border-gray-100 rounded-2xl h-12 px-4 focus:ring-orange-500/50"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">密码</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/50 border-gray-100 rounded-2xl h-12 px-4 focus:ring-orange-500/50"
                            required
                            minLength={6}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 mt-6 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 transition-opacity font-medium shadow-lg shadow-orange-500/20 text-white border-0"
                    >
                        {isLoading ? "处理中..." : isSignUp ? "注册并登录" : "登 录"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-gray-500 hover:text-orange-500 transition-colors"
                    >
                        {isSignUp ? "已有账号？点击去登录" : "没有账号？点击注册新账号"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
