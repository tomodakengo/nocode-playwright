"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getTestSuite } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusIcon,
  PlayIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TestSuiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const suiteId = Number(params.suiteId);

  const { data: suite, isLoading } = useQuery({
    queryKey: ["test-suite", suiteId],
    queryFn: () => getTestSuite(projectId, suiteId),
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

  if (!suite) {
    return (
      <div className="container py-10">
        <p className="text-red-500">テストスイートが見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{suite.name}</h1>
          <p className="text-gray-600 mt-2">{suite.description}</p>
        </div>
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/projects/${projectId}/test-suites/${suiteId}/edit`)
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
                <DialogTitle>テストスイートの削除</DialogTitle>
                <DialogDescription>
                  このテストスイートを削除してもよろしいですか？
                  この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>
                  キャンセル
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    // TODO: 削除処理を実装
                    router.push(`/projects/${projectId}`);
                  }}
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
            <CardTitle>テストスイート情報</CardTitle>
            <CardDescription>
              作成日: {new Date(suite.created_at).toLocaleDateString("ja-JP")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">ブラウザ</h3>
                <p className="text-sm text-gray-600">
                  {suite.browser_type.charAt(0).toUpperCase() +
                    suite.browser_type.slice(1)}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">ベースURL</h3>
                <p className="text-sm text-gray-600">{suite.base_url}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>テストケース一覧</CardTitle>
                <CardDescription>
                  このテストスイートに含まれるテストケース
                </CardDescription>
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/test-suites/${suiteId}/record`
                    )
                  }
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  記録を開始
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/test-suites/${suiteId}/test-cases/new`
                    )
                  }
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  手動で作成
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {suite.test_cases && suite.test_cases.length > 0 ? (
              <div className="space-y-4">
                {suite.test_cases.map((testCase) => (
                  <div
                    key={testCase.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/projects/${projectId}/test-suites/${suiteId}/test-cases/${testCase.id}`
                      )
                    }
                  >
                    <div>
                      <h3 className="font-medium">{testCase.name}</h3>
                      <p className="text-sm text-gray-600">
                        {testCase.description || "説明なし"}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(testCase.created_at).toLocaleDateString(
                        "ja-JP"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                テストケースがまだありません。新しいテストケースを作成してください。
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
