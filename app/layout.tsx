import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morning Tasks App",
  description: "AIとタスク管理のミニアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-100 text-gray-900">
        <div className="min-h-screen flex flex-col">
          {/* 共通ヘッダー */}
          <header className="border-b bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-blue-600">
                  Morning Tasks
                </span>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  mini dashboard
                </span>
              </Link>

              <nav className="flex items-center gap-4 text-sm">
                <Link href="/tasks" className="text-gray-600 hover:text-blue-600">
                  タスク一覧
                </Link>
                <Link href="/ai-bot" className="text-gray-600 hover:text-blue-600">
                  AIチャット
                </Link>
              </nav>
            </div>
          </header>

          {/* ページ内容 */}
          <main className="flex-1">{children}</main>

          {/* フッター */}
          <footer className="border-t bg-white">
            <div className="mx-auto max-w-4xl px-4 py-2 text-xs text-gray-400 flex justify-between">
              <span>© {new Date().getFullYear()} Morning Tasks</span>
              <span>Built with Next.js + Supabase + OpenAI</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}