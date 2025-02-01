"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getTestSuiteExecution } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

type ExecutionStatus = "success" | "failed" | "running" | "error";

export default function TestSuiteExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const suiteId = Number(params.suiteId);
  const executionId = Number(params.executionId);

  const { data: execution, isLoading } = useQuery({
    queryKey: ["test-suite-execution", executionId],
    queryFn: () => getTestSuiteExecution(projectId, suiteId, executionId),
    refetchInterval: (data) => (data?.status === "running" ? 1000 : false),
  });

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case "running":
        return <ClockIcon className="h-6 w-6 text-blue-500 animate-spin" />;
      case "error":
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: ExecutionStatus) => {
    switch (status) {
      case "success":
        return "成功";
      case "failed":
        return "失敗";
      case "running":
        return "実行中";
      case "error":
        return "エラー";
      default:
        return "";
    }
  };

  const getStatusClass = (status: ExecutionStatus) => {
    switch (status) {
      case "success":
        return "bg-green-50 text-green-700 border-green-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      case "running":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "error":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="container py-10">
        <p className="text-red-500">実行結果が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/projects/${projectId}/test-suites/${suiteId}/executions`
              )
            }
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            実行履歴一覧に戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{execution.test_suite.name}</h1>
            <p className="text-gray-600 mt-2">実行 #{execution.id}</p>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-full border ${getStatusClass(
            execution.status
          )}`}
        >
          <div className="flex items-center space-x-2">
            {getStatusIcon(execution.status)}
            <span className="font-medium">
              {getStatusText(execution.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>実行情報</CardTitle>
            <CardDescription>
              実行日時: {new Date(execution.started_at).toLocaleString("ja-JP")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">実行時間</div>
                <div className="text-2xl font-bold mt-1">
                  {execution.duration
                    ? `${(execution.duration / 1000).toFixed(2)}秒`
                    : "実行中"}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">成功したテスト</div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {execution.success_cases}/{execution.total_cases}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">成功率</div>
                <div className="text-2xl font-bold text-blue-700 mt-1">
                  {(
                    (execution.success_cases / execution.total_cases) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>テストケース実行結果</CardTitle>
            <CardDescription>各テストケースの実行状況と結果</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {execution.test_cases.map((testCase) => (
                <div
                  key={testCase.id}
                  className={`p-4 border rounded-lg ${
                    testCase.status === "running"
                      ? "border-blue-200 bg-blue-50"
                      : testCase.status === "failed"
                      ? "border-red-200 bg-red-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(testCase.status)}
                      <div>
                        <h3 className="font-medium">{testCase.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {testCase.description || "説明なし"}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {testCase.duration
                        ? `${(testCase.duration / 1000).toFixed(2)}秒`
                        : "実行中"}
                    </div>
                  </div>
                  {testCase.error && (
                    <div className="mt-4 p-3 bg-red-100 rounded text-sm text-red-700">
                      {testCase.error}
                    </div>
                  )}
                  {testCase.screenshot && (
                    <div className="mt-4">
                      <img
                        src={testCase.screenshot}
                        alt={`${testCase.name} screenshot`}
                        className="rounded-lg border shadow-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {execution.error && (
          <Card>
            <CardHeader>
              <CardTitle>エラー情報</CardTitle>
              <CardDescription>実行中に発生したエラーの詳細</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {execution.error}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
