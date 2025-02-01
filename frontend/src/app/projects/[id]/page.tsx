"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getProject } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
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

  if (!project) {
    return (
      <div className="container py-10">
        <p className="text-red-500">プロジェクトが見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <Button
          onClick={() => router.push(`/projects/${projectId}/test-suites/new`)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          テストスイートを作成
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>プロジェクト詳細</CardTitle>
            <CardDescription>
              作成日: {new Date(project.created_at).toLocaleDateString("ja-JP")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{project.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>テストスイート一覧</CardTitle>
            <CardDescription>
              このプロジェクトに含まれるテストスイート
            </CardDescription>
          </CardHeader>
          <CardContent>
            {project.test_suites && project.test_suites.length > 0 ? (
              <div className="space-y-4">
                {project.test_suites.map((suite) => (
                  <div
                    key={suite.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/projects/${projectId}/test-suites/${suite.id}`
                      )
                    }
                  >
                    <div>
                      <h3 className="font-medium">{suite.name}</h3>
                      <p className="text-sm text-gray-600">
                        {suite.description || "説明なし"}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(suite.created_at).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                テストスイートがまだありません。新しいテストスイートを作成してください。
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
