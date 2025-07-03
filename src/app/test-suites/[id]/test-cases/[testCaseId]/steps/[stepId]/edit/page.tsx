"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FormData {
  name: string;
  description: string;
  action: string;
  expected_result: string;
}

export default function EditTestStep({
  params,
}: {
  params: { id: string; testCaseId: string; stepId: string };
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    action: "",
    expected_result: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestStep = async () => {
      try {
        const response = await fetch(
          `/api/test-suites/${params.id}/test-cases/${params.testCaseId}/steps/${params.stepId}`
        );
        if (!response.ok) {
          throw new Error("テストステップの取得に失敗しました");
        }
        const data = await response.json();
        setFormData({
          name: data.name,
          description: data.description || "",
          action: data.action,
          expected_result: data.expected_result || "",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      }
    };

    fetchTestStep();
  }, [params.id, params.testCaseId, params.stepId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/test-suites/${params.id}/test-cases/${params.testCaseId}/steps/${params.stepId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "テストステップの更新に失敗しました");
      }

      router.push(`/test-suites/${params.id}/test-cases/${params.testCaseId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">テストステップの編集</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* 名前 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                ステップ名
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="テストステップ名を入力"
                required
              />
            </div>

            {/* 説明 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                説明
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="テストステップの説明を入力"
              />
            </div>

            {/* アクション */}
            <div>
              <label
                htmlFor="action"
                className="block text-sm font-medium text-gray-700"
              >
                アクション
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="action"
                name="action"
                value={formData.action}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="実行するアクションを入力"
                required
              />
            </div>

            {/* 期待結果 */}
            <div>
              <label
                htmlFor="expected_result"
                className="block text-sm font-medium text-gray-700"
              >
                期待結果
              </label>
              <textarea
                id="expected_result"
                name="expected_result"
                value={formData.expected_result}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="期待される結果を入力"
              />
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={submitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? "更新中..." : "更新"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
