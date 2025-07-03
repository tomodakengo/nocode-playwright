"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    testSuites: 0,
    testCases: 0,
    selectors: 0,
    recentExecutions: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // 各種統計情報を並行取得
      const [suitesRes, selectorsRes] = await Promise.all([
        fetch('/api/test-suites'),
        fetch('/api/selectors')
      ]);

      const suites = suitesRes.ok ? await suitesRes.json() : [];
      const selectors = selectorsRes.ok ? await selectorsRes.json() : [];

      // テストケース数の計算
      let totalTestCases = 0;
      for (const suite of suites) {
        try {
          const casesRes = await fetch(`/api/test-suites/${suite.id}/test-cases`);
          if (casesRes.ok) {
            const cases = await casesRes.json();
            totalTestCases += cases.length;
          }
        } catch (error) {
          console.error(`Failed to load test cases for suite ${suite.id}:`, error);
        }
      }

      setStats({
        testSuites: suites.length,
        testCases: totalTestCases,
        selectors: selectors.length,
        recentExecutions: 0, // TODO: 実行履歴から取得
        successRate: totalTestCases > 0 ? 85 : 0 // TODO: 実際の成功率を計算
      });
    } catch (error) {
      console.error('統計情報の取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStartCards = [
    {
      title: "🧪 テストを作成",
      description: "ドラッグ&ドロップでテストを簡単作成",
      link: "/test-builder",
      color: "bg-blue-500 hover:bg-blue-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200"
    },
    {
      title: "📚 テストスイート",
      description: "テストケースをグループ管理",
      link: "/test-suites",
      color: "bg-green-500 hover:bg-green-600",
      textColor: "text-green-600",
      bgColor: "bg-green-50 border-green-200"
    },
    {
      title: "🎯 セレクタ管理",
      description: "要素セレクタの登録・管理",
      link: "/pages",
      color: "bg-purple-500 hover:bg-purple-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50 border-purple-200"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="読み込み中">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="sr-only">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* ヘッダーセクション */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎭 NoCode Playwright
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            コードを書かずに、簡単にWebテストを作成・実行
          </p>
          <div className="flex justify-center">
            <Link
              href="/test-builder"
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
              aria-label="テストビルダーを開始"
            >
              🚀 テストを作成する
            </Link>
          </div>
        </div>
      </div>

      {/* クイックスタートカード */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 クイックスタート</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickStartCards.map((card, index) => (
            <Link
              key={index}
              href={card.link}
              className={`block p-6 rounded-lg border-2 ${card.bgColor} hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              aria-label={`${card.title}: ${card.description}`}
            >
              <div className="text-center">
                <h3 className={`text-xl font-bold ${card.textColor} mb-3`}>
                  {card.title}
                </h3>
                <p className="text-gray-700 mb-4">{card.description}</p>
                <div className={`inline-flex items-center px-4 py-2 text-white rounded-lg ${card.color} transition-colors`}>
                  開始 →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 統計情報 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 プロジェクト統計</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.testSuites}</div>
            <div className="text-gray-600">テストスイート</div>
            <div className="text-sm text-gray-500 mt-1">作成済み</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.testCases}</div>
            <div className="text-gray-600">テストケース</div>
            <div className="text-sm text-gray-500 mt-1">準備完了</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.selectors}</div>
            <div className="text-gray-600">セレクタ</div>
            <div className="text-sm text-gray-500 mt-1">登録済み</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.successRate}%</div>
            <div className="text-gray-600">成功率</div>
            <div className="text-sm text-gray-500 mt-1">直近実行</div>
          </div>
        </div>
      </div>

      {/* 特徴説明 */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">✨ 主な機能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ドラッグ&ドロップ
            </h3>
            <p className="text-gray-600">
              直感的な操作でテストを作成。プログラミング知識は不要です。
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              高速実行
            </h3>
            <p className="text-gray-600">
              Playwrightの高速・安定したテスト実行エンジンを活用。
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              スクリーンショット
            </h3>
            <p className="text-gray-600">
              実行結果の自動スクリーンショット取得とエラー時の詳細レポート。
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              豊富なアサーション
            </h3>
            <p className="text-gray-600">
              テキスト、要素、URL、タイトルなど様々な検証を簡単設定。
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">♿</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              アクセシビリティ
            </h3>
            <p className="text-gray-600">
              スクリーンリーダー対応、キーボードナビゲーション完全対応。
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              レスポンシブ
            </h3>
            <p className="text-gray-600">
              デスクトップ、タブレット、モバイルデバイス全対応。
            </p>
          </div>
        </div>
      </div>

      {/* 最近の実行履歴 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📝 最近の実行履歴</h2>
        <div className="border rounded-lg">
          <div className="px-6 py-4 text-gray-500 text-center border-b bg-gray-50">
            <div className="text-4xl mb-2">📊</div>
            <p>実行履歴はまだありません</p>
            <p className="text-sm mt-1">
              <Link href="/test-builder" className="text-blue-600 hover:text-blue-800 underline">
                テストビルダー
              </Link>
              からテストを作成・実行してください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
