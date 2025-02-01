"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { getTestExecution } from "@/services/api";

interface ExecutionStatusProps {
  executionId: number;
  onComplete?: () => void;
}

export default function ExecutionStatus({
  executionId,
  onComplete,
}: ExecutionStatusProps) {
  const { data: execution, error } = useQuery({
    queryKey: ["execution", executionId],
    queryFn: () => getTestExecution(executionId),
    refetchInterval: (data) =>
      data?.status === "completed" ||
      data?.status === "failed" ||
      data?.status === "cancelled"
        ? false
        : 1000,
  });

  useEffect(() => {
    if (
      execution?.status === "completed" ||
      execution?.status === "failed" ||
      execution?.status === "cancelled"
    ) {
      onComplete?.();
    }
  }, [execution?.status, onComplete]);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              実行状態の取得に失敗しました
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error instanceof Error ? error.message : "不明なエラー"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              実行状態を取得中...
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: ClockIcon,
      bgColor: "bg-blue-50",
      textColor: "text-blue-800",
      iconColor: "text-blue-400",
      label: "実行待ち",
    },
    running: {
      icon: ClockIcon,
      bgColor: "bg-blue-50",
      textColor: "text-blue-800",
      iconColor: "text-blue-400",
      label: "実行中",
    },
    completed: {
      icon: CheckCircleIcon,
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      iconColor: "text-green-400",
      label: "完了",
    },
    failed: {
      icon: XCircleIcon,
      bgColor: "bg-red-50",
      textColor: "text-red-800",
      iconColor: "text-red-400",
      label: "失敗",
    },
    cancelled: {
      icon: ExclamationTriangleIcon,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-400",
      label: "キャンセル",
    },
  };

  const config = statusConfig[execution.status];
  const StatusIcon = config.icon;

  return (
    <div>
      <div className={`rounded-md ${config.bgColor} p-4`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <StatusIcon
              className={`h-5 w-5 ${config.iconColor}`}
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${config.textColor}`}>
              {config.label}
            </h3>
            <div className={`mt-2 text-sm ${config.textColor}`}>
              <p>
                開始時刻:{" "}
                {execution.started_at
                  ? format(
                      new Date(execution.started_at),
                      "yyyy/MM/dd HH:mm:ss"
                    )
                  : "未開始"}
              </p>
              {execution.completed_at && (
                <p>
                  完了時刻:{" "}
                  {format(
                    new Date(execution.completed_at),
                    "yyyy/MM/dd HH:mm:ss"
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {execution.results && execution.results.length > 0 && (
        <div className="mt-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                テスト結果
              </h3>
            </div>
          </div>
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        >
                          セレクタ
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          期待値
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          実際の値
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          結果
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {execution.results.map((result, index) => (
                        <tr key={index}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {result.selector}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {JSON.stringify(result.expected_value)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {JSON.stringify(result.actual_value)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            {result.passed ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                成功
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                失敗
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {execution.error && (
        <div className="mt-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon
                  className="h-5 w-5 text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラー</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{execution.error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {execution.screenshots && execution.screenshots.length > 0 && (
        <div className="mt-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                スクリーンショット
              </h3>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {execution.screenshots.map((screenshot, index) => (
              <div
                key={index}
                className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-100"
              >
                <img
                  src={screenshot.url}
                  alt={`スクリーンショット ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50 p-4">
                  <p className="text-sm text-white">
                    {format(
                      new Date(screenshot.timestamp),
                      "yyyy/MM/dd HH:mm:ss"
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
