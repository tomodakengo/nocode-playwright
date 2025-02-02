"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  name: string;
  selector_type: string;
  selector_value: string;
  description: string;
}

export default function NewSelectorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    selector_type: "xpath",
    selector_value: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
      const response = await fetch("/api/selectors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "セレクタの作成に失敗しました");
      }

      router.push("/selectors");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">新規セレクタ</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* 名前 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                名前
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

            {/* タイプ */}
            <div>
              <label
                htmlFor="selector_type"
                className="block text-sm font-medium text-gray-700"
              >
                タイプ
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
                <option value="xpath">XPath</option>
                <option value="css">CSS</option>
              </select>
            </div>

            {/* 値 */}
            <div>
              <label
                htmlFor="selector_value"
                className="block text-sm font-medium text-gray-700"
              >
                値<span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="selector_value"
                name="selector_value"
                value={formData.selector_value}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                placeholder={
                  formData.selector_type === "xpath"
                    ? "//div[@class='example']"
                    : ".example > div"
                }
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
                placeholder="セレクタの説明を入力"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/selectors")}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              submitting
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {submitting ? "作成中..." : "作成"}
          </button>
        </div>
      </form>
    </div>
  );
}
