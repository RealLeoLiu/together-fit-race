import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TogetherFit Race — 多人减脂马拉松",
  description:
    "带有游戏化竞赛性质的多人体重打卡 Web App，一起变更好！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${nunito.variable} font-sans antialiased`}
      >
        {/* 暖色调全屏背景 + 手机居中容器 */}
        <div className="min-h-screen bg-[#FFF8F2] flex justify-center">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl min-h-screen">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
