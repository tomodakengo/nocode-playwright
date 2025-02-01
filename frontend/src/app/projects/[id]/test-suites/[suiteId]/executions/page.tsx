"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getTestSuite, getTestSuiteExecutions } from "@/services/api";
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
  ChartBarIcon,
} from "@heroicons/react/24/outline";

type ExecutionStatus = "success" | "failed" | "running" | "error";

export default function TestSuiteExecutionsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const suiteId = Number(params.suiteId);

  const { data: suite, isLoading: isLoadingSuite } = useQuery({
    queryKey: ["test-suite", suiteId],
    queryFn: () => getTestSuite(projectId, suiteId),
  });

  const { data: executions, isLoading: isLoadingExecutions } = useQuery({
    queryKey: ["test-suite-executions", suiteId],
    queryFn: () => getTestSuiteExecutions(projectId, suiteId),
  });

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "running":
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case "error":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
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

  const calculateStats = (executions: any[]) => {
    const total = executions.length;
    const success = executions.filter((e) => e.status === "success").length;
    const failed = executions.filter((e) => e.status === "failed").length;
    const error = executions.filter((e) => e.status === "error").length;

    return {
      total,
      success,
      failed,
      error,
      successRate: total > 0 ? (success / total) * 100 : 0,
    };
  };

  if (isLoadingSuite || isLoadingExecutions) {
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

  if (!suite || !executions) {
    return (
      <div className="container py-10">
        <p className="text-red-500">テストスイートが見つかりませんでした。</p>
      </div>
    );
  }

  const stats = calculateStats(executions);

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/projects/${projectId}/test-suites/${suiteId}`)
            }
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            テストスイートに戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{suite.name}</h1>
            <p className="text-gray-600 mt-2">実行履歴</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>実行統計</CardTitle>
                <CardDescription>これまでの実行結果の統計情報</CardDescription>
              </div>
              <ChartBarIcon className="h-6 w-6 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">総実行回数</div>
                <div className="text-2xl font-bold mt-1">{stats.total}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">成功</div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {stats.success}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600">失敗</div>
                <div className="text-2xl font-bold text-red-700 mt-1">
                  {stats.failed}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">成功率</div>
                <div className="text-2xl font-bold text-blue-700 mt-1">
                  {stats.successRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>実行履歴一覧</CardTitle>
            <CardDescription>最新の実行結果から順に表示</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/test-suites/${suiteId}/executions/${execution.id}`
                    )
                  }
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(execution.status)}
                    <div>
                      <div className="font-medium">実行 #{execution.id}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(execution.started_at).toLocaleString("ja-JP")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {execution.duration
                        ? `${(execution.duration / 1000).toFixed(2)}秒`
                        : "実行中"}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm ${getStatusClass(
                        execution.status
                      )}`}
                    >
                      {execution.total_cases}件中{execution.success_cases}件成功
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
