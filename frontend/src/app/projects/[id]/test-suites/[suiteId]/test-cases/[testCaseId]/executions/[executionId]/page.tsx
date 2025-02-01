"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getTestExecution } from "@/services/api";
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
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

type ExecutionStatus = "success" | "failed" | "running" | "error";

export default function TestExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const suiteId = Number(params.suiteId);
  const testCaseId = Number(params.testCaseId);
  const executionId = Number(params.executionId);

  const { data: execution, isLoading } = useQuery({
    queryKey: ["test-execution", executionId],
    queryFn: () =>
      getTestExecution(projectId, suiteId, testCaseId, executionId),
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
                `/projects/${projectId}/test-suites/${suiteId}/test-cases/${testCaseId}`
              )
            }
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            テストケースに戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{execution.test_case.name}</h1>
            <p className="text-gray-600 mt-2">実行結果</p>
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
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">実行時間</h3>
                <p className="text-sm text-gray-600">
                  {execution.duration
                    ? `${(execution.duration / 1000).toFixed(2)}秒`
                    : "計測中..."}
                </p>
              </div>
              {execution.error && (
                <div>
                  <h3 className="font-medium mb-2">エラー内容</h3>
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {execution.error}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>実行ステップ</CardTitle>
            <CardDescription>各ステップの実行状況と結果</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {execution.steps.map((step, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    step.status === "running"
                      ? "border-blue-200 bg-blue-50"
                      : step.status === "failed"
                      ? "border-red-200 bg-red-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-500">
                        {index + 1}.
                      </span>
                      <div>
                        <h3 className="font-medium">{step.action}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          ターゲット: {step.target}
                        </p>
                        {step.value && (
                          <p className="text-sm text-gray-600">
                            入力値: {step.value}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusIcon(step.status)}
                  </div>
                  {step.error && (
                    <div className="mt-4 p-3 bg-red-100 rounded text-sm text-red-700">
                      {step.error}
                    </div>
                  )}
                  {step.screenshot && (
                    <div className="mt-4">
                      <img
                        src={step.screenshot}
                        alt={`Step ${index + 1} screenshot`}
                        className="rounded-lg border shadow-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
