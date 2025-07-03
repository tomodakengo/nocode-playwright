"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FormData {
  name: string;
  selector_type: string;
  selector_value: string;
  description: string;
  is_dynamic: boolean;
  wait_condition: string;
}

export default function EditSelector({
  params,
}: {
  params: { id: string; selectorId: string };
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    selector_type: "css",
    selector_value: "",
    description: "",
    is_dynamic: false,
    wait_condition: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSelector = async () => {
      try {
        const response = await fetch(
          `/api/pages/${params.id}/selectors/${params.selectorId}`
        );
        if (!response.ok) {
          throw new Error("セレクタの取得に失敗しました");
        }
        const data = await response.json();
        setFormData({
          name: data.name,
          selector_type: data.selector_type,
          selector_value: data.selector_value,
          description: data.description || "",
          is_dynamic: data.is_dynamic === 1,
          wait_condition: data.wait_condition || "",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSelector();
  }, [params.id, params.selectorId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/pages/${params.id}/selectors/${params.selectorId}`,
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
        throw new Error(data.error || "セレクタの更新に失敗しました");
      }

      router.push(`/pages/${params.id}/selectors`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">セレクタの編集</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* セレクタ名 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                セレクタ名
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="セレクタ名を入力"
                required
              />
            </div>

            {/* セレクタタイプ */}
            <div>
              <label
                htmlFor="selector_type"
                className="block text-sm font-medium text-gray-700"
              >
                セレクタタイプ
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="selector_type"
                name="selector_type"
                value={formData.selector_type}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="css">CSS</option>
                <option value="xpath">XPath</option>
                <option value="text">テキスト</option>
                <option value="id">ID</option>
                <option value="name">Name</option>
              </select>
            </div>

            {/* セレクタ値 */}
            <div>
              <label
                htmlFor="selector_value"
                className="block text-sm font-medium text-gray-700"
              >
                セレクタ値
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="selector_value"
                name="selector_value"
                value={formData.selector_value}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="セレクタ値を入力"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                選択したタイプに応じた適切なセレクタ値を入力してください
              </p>
            </div>

            {/* 動的セレクタ */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_dynamic"
                name="is_dynamic"
                checked={formData.is_dynamic}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_dynamic"
                className="ml-2 block text-sm text-gray-700"
              >
                動的セレクタ
              </label>
            </div>

            {/* 待機条件 */}
            <div>
              <label
                htmlFor="wait_condition"
                className="block text-sm font-medium text-gray-700"
              >
                待機条件
              </label>
              <input
                type="text"
                id="wait_condition"
                name="wait_condition"
                value={formData.wait_condition}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例: visible, clickable など"
              />
              <p className="mt-1 text-sm text-gray-500">
                要素の待機条件を指定できます（オプション）
              </p>
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
                placeholder="セレクタの説明を入力"
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
