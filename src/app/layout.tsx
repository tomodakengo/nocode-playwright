import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NoCode Playwright",
  description: "No-code test automation tool for Playwright",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen flex">
          {/* サイドバー */}
          <div className="w-64 bg-gray-800 text-white">
            <div className="p-4">
              <h1 className="text-xl font-bold">NoCode Playwright</h1>
            </div>
            <nav className="mt-4">
              <a
                href="/"
                className="block px-4 py-2 hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                ダッシュボード
              </a>
              <a
                href="/test-suites"
                className="block px-4 py-2 hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                テストスイート
              </a>
              <a
                href="/test-cases"
                className="block px-4 py-2 hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                テストケース
              </a>
              <a
                href="/selectors"
                className="block px-4 py-2 hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                セレクタ
              </a>
              <a
                href="/reports"
                className="block px-4 py-2 hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                レポート
              </a>
            </nav>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 bg-gray-100">
            <main className="p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
