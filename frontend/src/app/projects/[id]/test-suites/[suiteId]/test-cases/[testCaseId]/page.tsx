"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTestCase, executeTestCase, deleteTestCase } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlayIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

type ExecutionStatus = "idle" | "running" | "success" | "failed";

export default function TestCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const suiteId = Number(params.suiteId);
  const testCaseId = Number(params.testCaseId);

  const { data: testCase, isLoading } = useQuery({
    queryKey: ["test-case", testCaseId],
    queryFn: () => getTestCase(projectId, suiteId, testCaseId),
  });

  const executeMutation = useMutation({
    mutationFn: () => executeTestCase(projectId, suiteId, testCaseId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTestCase(projectId, suiteId, testCaseId),
    onSuccess: () => {
      router.push(`/projects/${projectId}/test-suites/${suiteId}`);
    },
  });

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

  if (!testCase) {
    return (
      <div className="container py-10">
        <p className="text-red-500">テストケースが見つかりませんでした。</p>
      </div>
    );
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "running":
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{testCase.name}</h1>
          <p className="text-gray-600 mt-2">{testCase.description}</p>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={() => executeMutation.mutate()}
            disabled={executeMutation.isLoading}
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            実行
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/projects/${projectId}/test-suites/${suiteId}/test-cases/${testCaseId}/edit`
              )
            }
          >
            <PencilSquareIcon className="h-4 w-4 mr-2" />
            編集
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                削除
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>テストケースの削除</DialogTitle>
                <DialogDescription>
                  このテストケースを削除してもよろしいですか？
                  この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>
                  キャンセル
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isLoading}
                >
                  削除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>テストケース情報</CardTitle>
            <CardDescription>
              作成日:{" "}
              {new Date(testCase.created_at).toLocaleDateString("ja-JP")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">最終実行</h3>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(testCase.last_execution?.status || "idle")}
                  <span className="text-sm text-gray-600">
                    {testCase.last_execution
                      ? new Date(
                          testCase.last_execution.executed_at
                        ).toLocaleString("ja-JP")
                      : "未実行"}
                  </span>
                </div>
              </div>
              {testCase.last_execution?.error && (
                <div>
                  <h3 className="font-medium mb-2">エラー内容</h3>
                  <p className="text-sm text-red-500">
                    {testCase.last_execution.error}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>テストステップ</CardTitle>
            <CardDescription>
              このテストケースで実行されるステップ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testCase.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        {index + 1}.
                      </span>
                      <h3 className="font-medium">{step.action}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      ターゲット: {step.target}
                    </p>
                    {step.value && (
                      <p className="text-sm text-gray-600">
                        入力値: {step.value}
                      </p>
                    )}
                  </div>
                  {executeMutation.isLoading &&
                    executeMutation.variables === index && (
                      <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />
                    )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {executeMutation.isError && (
          <p className="text-sm text-red-500">
            テストの実行中にエラーが発生しました。もう一度お試しください。
          </p>
        )}
      </div>
    </div>
  );
}
