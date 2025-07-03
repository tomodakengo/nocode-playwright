"use client";

import { useState, useEffect } from 'react';
import TestStepGrid from '@/components/TestStepGrid';

export default function TestBuilderPage() {
  const [testCases, setTestCases] = useState<any[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    try {
      // まずテストスイートを取得
      const suitesResponse = await fetch('/api/test-suites');
      const suites = await suitesResponse.json();
      
      if (suites.length > 0) {
        // 最初のスイートのテストケースを取得
        const casesResponse = await fetch(`/api/test-suites/${suites[0].id}/test-cases`);
        const cases = await casesResponse.json();
        setTestCases(cases);
        
        if (cases.length > 0) {
          setSelectedTestCase(cases[0].id);
        }
      }
    } catch (error) {
      console.error('テストケースの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeTest = async () => {
    if (!selectedTestCase) return;

    try {
      const response = await fetch(`/api/test-cases/${selectedTestCase}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headless: true, timeout: 30000 })
      });
      
      const result = await response.json();
      alert(`テスト実行結果: ${result.status}\n実行時間: ${result.duration}ms`);
    } catch (error) {
      alert('テストの実行に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🧪 NoCode Playwright テストビルダー
          </h1>
          <div className="flex gap-4">
            {testCases.length > 0 && (
              <select
                value={selectedTestCase || ''}
                onChange={(e) => setSelectedTestCase(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {testCases.map((testCase) => (
                  <option key={testCase.id} value={testCase.id}>
                    {testCase.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={executeTest}
              disabled={!selectedTestCase}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ▶️ テスト実行
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* アクションライブラリ */}
          <div className="lg:col-span-1">
            <ActionLibrary />
          </div>

          {/* テストステップエリア */}
          <div className="lg:col-span-2">
            {selectedTestCase ? (
              <TestStepGrid 
                testCaseId={selectedTestCase}
                onStepUpdate={(steps) => console.log('Steps updated:', steps)}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🧪</div>
                <p className="text-lg">テストケースを選択してください</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionLibrary() {
  const [actionTypes, setActionTypes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/action-types')
      .then(res => res.json())
      .then(data => setActionTypes(data))
      .catch(err => console.error('アクションタイプの取得に失敗:', err));
  }, []);

  const actionCategories = {
    interaction: ['click', 'double_click', 'right_click', 'hover', 'focus', 'blur'],
    input: ['type', 'fill', 'clear', 'press', 'press_sequentially'],
    form: ['check', 'uncheck', 'select_option', 'select_text', 'upload_file'],
    navigation: ['navigate', 'go_back', 'go_forward', 'reload', 'close_page'],
    scroll: ['scroll_into_view', 'scroll_to_top', 'scroll_to_bottom', 'scroll_by'],
    wait: ['wait', 'wait_for_selector', 'wait_for_text', 'wait_for_url', 'wait_for_timeout'],
    assert: ['assert_visible', 'assert_text', 'assert_value', 'assert_url', 'assert_title'],
    screenshot: ['screenshot', 'screenshot_element']
  };

  const categoryNames = {
    interaction: '🖱️ インタラクション',
    input: '⌨️ 入力',
    form: '📝 フォーム',
    navigation: '🌐 ナビゲーション',
    scroll: '📜 スクロール',
    wait: '⏱️ 待機',
    assert: '✅ 検証',
    screenshot: '📸 スクリーンショット'
  };

  const getActionIcon = (actionName: string) => {
    const iconMap: { [key: string]: string } = {
      'click': '👆', 'double_click': '👆👆', 'right_click': '🖱️',
      'type': '⌨️', 'fill': '📝', 'navigate': '🌐',
      'wait': '⏱️', 'assert_visible': '👁️', 'screenshot': '📸',
      'hover': '🖱️', 'check': '✅', 'uncheck': '❌',
      'scroll_into_view': '📜', 'press': '⚡'
    };
    return iconMap[actionName] || '🔧';
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 h-fit">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        📚 アクションライブラリ
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        ドラッグしてテストステップに追加
      </p>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(actionCategories).map(([category, actions]) => (
          <div key={category} className="bg-white rounded-lg p-3">
            <h3 className="font-medium text-gray-800 mb-2">
              {categoryNames[category as keyof typeof categoryNames]}
            </h3>
            <div className="space-y-2">
              {actions.map(actionName => {
                const actionType = actionTypes.find(at => at.name === actionName);
                if (!actionType) return null;
                
                return (
                  <div
                    key={actionName}
                    className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-colors"
                    draggable
                  >
                    <span className="text-lg">{getActionIcon(actionName)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {actionType.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {actionType.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}