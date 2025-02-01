"use client";

import { useEffect, useState } from "react";

interface ActionType {
  id: number;
  name: string;
  description: string;
  has_value: number;
  has_selector: number;
  has_assertion: number;
}

interface Selector {
  id: number;
  name: string;
  selector_type: string;
  selector_value: string;
}

interface FormData {
  action_type_id: string;
  selector_id: string | null;
  input_value: string;
  assertion_value: string;
  description: string;
}

interface TestStepFormProps {
  testCaseId: string;
  stepId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TestStepForm({
  testCaseId,
  stepId,
  onSuccess,
  onCancel,
}: TestStepFormProps) {
  const [formData, setFormData] = useState<FormData>({
    action_type_id: "",
    selector_id: null,
    input_value: "",
    assertion_value: "",
    description: "",
  });
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActionType, setSelectedActionType] =
    useState<ActionType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // アクションタイプの取得
        const actionTypesResponse = await fetch("/api/action-types");
        if (!actionTypesResponse.ok) {
          throw new Error("アクションタイプの取得に失敗しました");
        }
        const actionTypesData = await actionTypesResponse.json();
        setActionTypes(actionTypesData);

        // セレクタの取得
        const selectorsResponse = await fetch(`/api/pages/1/selectors`);
        if (!selectorsResponse.ok) {
          throw new Error("セレクタの取得に失敗しました");
        }
        const selectorsData = await selectorsResponse.json();
        setSelectors(selectorsData);

        // 編集時は既存のデータを取得
        if (stepId) {
          const stepResponse = await fetch(
            `/api/test-suites/${testCaseId.split("/")[0]}/test-cases/${
              testCaseId.split("/")[1]
            }/steps/${stepId}`
          );
          if (!stepResponse.ok) {
            throw new Error("テストステップの取得に失敗しました");
          }
          const stepData = await stepResponse.json();
          setFormData({
            action_type_id: stepData.action_type_id.toString(),
            selector_id: stepData.selector_id?.toString() || null,
            input_value: stepData.input_value || "",
            assertion_value: stepData.assertion_value || "",
            description: stepData.description || "",
          });
          setSelectedActionType(
            actionTypesData.find(
              (at: ActionType) => at.id === Number(stepData.action_type_id)
            )
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testCaseId, stepId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "action_type_id") {
      const actionType = actionTypes.find((at) => at.id === Number(value));
      setSelectedActionType(actionType || null);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        selector_id: actionType?.has_selector ? prev.selector_id : null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const [suiteId, caseId] = testCaseId.split("/");
      const url = stepId
        ? `/api/test-suites/${suiteId}/test-cases/${caseId}/steps/${stepId}`
        : `/api/test-suites/${suiteId}/test-cases/${caseId}/steps`;
      const method = stepId ? "PUT" : "POST";

      const selectedAction = actionTypes.find(
        (at) => at.id === Number(formData.action_type_id)
      );
      if (!selectedAction) {
        throw new Error("アクションタイプを選択してください");
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test_case_id: parseInt(caseId),
          name: selectedAction.name,
          action: selectedAction.name,
          action_type_id: parseInt(formData.action_type_id),
          selector_id:
            selectedAction.has_selector && formData.selector_id
              ? parseInt(formData.selector_id)
              : null,
          input_value: selectedAction.has_value ? formData.input_value : null,
          assertion_value: selectedAction.has_assertion
            ? formData.assertion_value
            : null,
          description: formData.description || null,
          order_index: stepId ? undefined : 9999,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "テストステップの保存に失敗しました");
      }

      onSuccess();
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
      <div className="text-center py-4">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* アクションタイプ */}
      <div>
        <label
          htmlFor="action_type_id"
          className="block text-sm font-medium text-gray-700"
        >
          アクションタイプ
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          id="action_type_id"
          name="action_type_id"
          value={formData.action_type_id}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option value="">選択してください</option>
          {actionTypes.map((actionType) => (
            <option key={actionType.id} value={actionType.id}>
              {actionType.name}
            </option>
          ))}
        </select>
        {selectedActionType?.description && (
          <p className="mt-1 text-sm text-gray-500">
            {selectedActionType.description}
          </p>
        )}
      </div>

      {/* セレクタ */}
      {selectedActionType?.has_selector ? (
        <div>
          <label
            htmlFor="selector_id"
            className="block text-sm font-medium text-gray-700"
          >
            セレクタ
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="selector_id"
            name="selector_id"
            value={formData.selector_id || ""}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">選択してください</option>
            {selectors.map((selector) => (
              <option key={selector.id} value={selector.id}>
                {selector.name} ({selector.selector_value})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* 入力値 */}
      {selectedActionType?.has_value ? (
        <div>
          <label
            htmlFor="input_value"
            className="block text-sm font-medium text-gray-700"
          >
            入力値
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="input_value"
            name="input_value"
            value={formData.input_value}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      ) : null}

      {/* 検証値 */}
      {selectedActionType?.has_assertion ? (
        <div>
          <label
            htmlFor="assertion_value"
            className="block text-sm font-medium text-gray-700"
          >
            検証値
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="assertion_value"
            name="assertion_value"
            value={formData.assertion_value}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      ) : null}

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
        />
      </div>

      {/* ボタン */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
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
          {submitting ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
