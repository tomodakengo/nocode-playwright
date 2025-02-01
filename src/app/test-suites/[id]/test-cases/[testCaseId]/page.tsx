"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TestCase {
  id: number;
  suite_id: number;
  suite_name: string;
  name: string;
  description: string;
  before_each: string;
  after_each: string;
  created_at: string;
  updated_at: string;
}

interface TestStep {
  id: number;
  case_id: number;
  name: string;
  description: string;
  action: string;
  expected_result: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function TestCaseDetail({
  params,
}: {
  params: { id: string; testCaseId: string };
}) {
  const router = useRouter();
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // テストケースの取得
        const caseResponse = await fetch(
          `/api/test-suites/${params.id}/test-cases/${params.testCaseId}`
        );

        if (!caseResponse.ok) {
          const data = await caseResponse.json();
          throw new Error(data.error || "テストケースの取得に失敗しました");
        }

        const caseData = await caseResponse.json();
        setTestCase(caseData);

        // テストステップの取得
        const stepsResponse = await fetch(
          `/api/test-suites/${params.id}/test-cases/${params.testCaseId}/steps`
        );

        if (!stepsResponse.ok) {
          const data = await stepsResponse.json();
          throw new Error(data.error || "テストステップの取得に失敗しました");
        }

        const stepsData = await stepsResponse.json();
        setTestSteps(stepsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, params.testCaseId]);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/test-suites/${params.id}/test-cases/${params.testCaseId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "テストケースの削除に失敗しました");
      }

      router.push(`/test-suites/${params.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!testCase) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{testCase.name}</h1>
          <p className="text-sm text-gray-500">
            テストスイート: {testCase.suite_name}
          </p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            戻る
          </button>
          <button
            onClick={() =>
              router.push(
                `/test-suites/${params.id}/test-cases/${params.testCaseId}/edit`
              )
            }
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            編集
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            削除
          </button>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 space-y-6">
          {/* 説明 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900">説明</h2>
            <p className="mt-2 text-gray-600">
              {testCase.description || "説明はありません"}
            </p>
          </div>

          {/* 前処理 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              前処理 (beforeEach)
            </h2>
            <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-auto">
              <code>
                {testCase.before_each || "前処理は設定されていません"}
              </code>
            </pre>
          </div>

          {/* 後処理 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              後処理 (afterEach)
            </h2>
            <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-auto">
              <code>{testCase.after_each || "後処理は設定されていません"}</code>
            </pre>
          </div>

          {/* メタ情報 */}
          <div className="border-t pt-6">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">作成日時</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(testCase.created_at).toLocaleString("ja-JP")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">更新日時</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(testCase.updated_at).toLocaleString("ja-JP")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* テストステップ一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              テストステップ
            </h2>
            <button
              onClick={() =>
                router.push(
                  `/test-suites/${params.id}/test-cases/${params.testCaseId}/steps/new`
                )
              }
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              ステップを追加
            </button>
          </div>

          {testSteps.length === 0 ? (
            <p className="text-gray-500">テストステップはまだありません</p>
          ) : (
            <div className="space-y-4">
              {testSteps.map((step) => (
                <div
                  key={step.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {step.order_index}. {step.name}
                      </h3>
                      {step.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {step.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/test-suites/${params.id}/test-cases/${params.testCaseId}/steps/${step.id}/edit`
                          )
                        }
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        編集
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">
                        アクション
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {step.action}
                      </p>
                    </div>
                    {step.expected_result && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">
                          期待結果
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {step.expected_result}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900">
              テストケースを削除しますか？
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              この操作は取り消すことができません。
            </p>
            <div className="mt-4 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={deleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleting}
              >
                {deleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
