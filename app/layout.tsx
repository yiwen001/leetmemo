import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/global.sass";
import SessionProvider from "./components/providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LeetMemo - LeetCode复习系统",
  description: "使用艾宾浩斯遗忘曲线复习LeetCode题目",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        {/* <SessionProvider> */}
          {children}
        {/* </SessionProvider> */}
      </body>
    </html>
  );
}