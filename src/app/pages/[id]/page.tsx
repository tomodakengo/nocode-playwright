"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";

interface Page {
  id: number;
  name: string;
  url_pattern: string;
  description: string;
  selector_count: number;
  created_at: string;
  updated_at: string;
}

interface Selector {
  id: number;
  name: string;
  selector_type: string;
  selector_value: string;
  description: string | null;
}

export default function PageDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showNewSelectorForm, setShowNewSelectorForm] = useState(false);
  const [newSelector, setNewSelector] = useState({
    name: "",
    selector_type: "xpath",
    selector_value: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ページ情報の取得
        const pageResponse = await fetch(`/api/pages/${params.id}`);
        if (!pageResponse.ok) {
          throw new Error("ページの取得に失敗しました");
        }
        const pageData = await pageResponse.json();
        setPage(pageData);

        // セレクタ一覧の取得
        const selectorsResponse = await fetch(
          `/api/pages/${params.id}/selectors`
        );
        if (!selectorsResponse.ok) {
          if (selectorsResponse.status === 404) {
            // セレクタが存在しない場合は空配列を設定
            setSelectors([]);
            return;
          }
          throw new Error("セレクタの取得に失敗しました");
        }
        const selectorsData = await selectorsResponse.json();
        setSelectors(selectorsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/pages/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "ページの削除に失敗しました");
      }

      router.push("/pages");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
      setIsDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleNewSelectorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/pages/${params.id}/selectors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSelector),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "セレクタの作成に失敗しました");
      }

      const data = await response.json();
      setSelectors((prev) => [...prev, { ...newSelector, id: data.id }]);
      setShowNewSelectorForm(false);
      setNewSelector({
        name: "",
        selector_type: "xpath",
        selector_value: "",
        description: "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSelector = async (id: number) => {
    if (!confirm("このセレクタを削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/pages/${params.id}/selectors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "セレクタの削除に失敗しました");
      }

      setSelectors((prev) => prev.filter((selector) => selector.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">ページが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold">{page.name}</h1>
          {page.description && (
            <p className="mt-2 text-gray-600">{page.description}</p>
          )}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push(`/pages/${page.id}/selectors`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            セレクタ管理
          </button>
          <button
            onClick={() => router.push(`/pages/${page.id}/edit`)}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            編集
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            削除
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">URLパターン</dt>
              <dd className="mt-1 text-sm text-gray-900">{page.url_pattern}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">セレクタ数</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {page.selector_count}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">作成日時</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(page.created_at).toLocaleString()}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">最終更新</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(page.updated_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">セレクタ一覧</h2>
          <button
            onClick={() => setShowNewSelectorForm(!showNewSelectorForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {showNewSelectorForm ? "キャンセル" : "新規セレクタ"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
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

        {showNewSelectorForm && (
          <form
            onSubmit={handleNewSelectorSubmit}
            className="bg-white shadow rounded-lg mb-6"
          >
            <div className="p-6 space-y-4">
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
                  value={newSelector.name}
                  onChange={(e) =>
                    setNewSelector((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>
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
                  value={newSelector.selector_type}
                  onChange={(e) =>
                    setNewSelector((prev) => ({
                      ...prev,
                      selector_type: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full px-4 py-2 border rounded-md"
                  required
                >
                  <option value="xpath">XPath</option>
                  <option value="css">CSS</option>
                </select>
              </div>
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
                  value={newSelector.selector_value}
                  onChange={(e) =>
                    setNewSelector((prev) => ({
                      ...prev,
                      selector_value: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 block w-full px-4 py-2 border rounded-md font-mono"
                  required
                />
              </div>
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
                  value={newSelector.description}
                  onChange={(e) =>
                    setNewSelector((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 block w-full px-4 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowNewSelectorForm(false)}
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
        )}

        {selectors.length > 0 ? (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    値
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectors.map((selector) => (
                  <tr key={selector.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {selector.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selector.selector_type === "xpath"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {selector.selector_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-mono">
                        {selector.selector_value}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {selector.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteSelector(selector.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">セレクタがまだ登録されていません</p>
            {!showNewSelectorForm && (
              <button
                onClick={() => setShowNewSelectorForm(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                最初のセレクタを作成
              </button>
            )}
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  ページの削除
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    このページを削除してもよろしいですか？
                    この操作は取り消すことができません。
                  </p>
                </div>

                <div className="mt-4 flex justify-end space-x-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={deleting}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "削除中..." : "削除"}
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
