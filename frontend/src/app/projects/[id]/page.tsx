"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  getProject,
  getTestSuites,
  getProjectStatistics,
} from "@/services/api";
import { Button } from "@/components/ui/Button";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = Number(params.id);

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: testSuites, isLoading: isLoadingTestSuites } = useQuery({
    queryKey: ["testSuites", projectId],
    queryFn: () => getTestSuites(projectId),
  });

  const { data: statistics, isLoading: isLoadingStatistics } = useQuery({
    queryKey: ["statistics", projectId],
    queryFn: () => getProjectStatistics(projectId),
  });

  if (isLoadingProject || isLoadingTestSuites || isLoadingStatistics) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {project?.name}
          </h2>
          <p className="mt-2 text-sm text-gray-500">{project?.description}</p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link href={`/projects/${projectId}/edit`}>
            <Button variant="outline" className="ml-3">
              編集
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-md bg-indigo-500 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">TS</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    テストスイート数
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {testSuites?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-md bg-green-500 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">SR</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    成功率
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statistics
                      ? `${Math.round(statistics.success_rate)}%`
                      : "-"}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-md bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">EX</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    総実行回数
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statistics?.total_executions || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              テストスイート
            </h3>
            <p className="mt-2 text-sm text-gray-700">
              プロジェクトに含まれるテストスイートの一覧です。
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link href={`/projects/${projectId}/test-suites/new`}>
              <Button>
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                新規作成
              </Button>
            </Link>
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
                        テストスイート名
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        タイプ
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        ブラウザ
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        作成日
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {testSuites?.map((suite) => (
                      <tr key={suite.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link
                            href={`/test-suites/${suite.id}`}
                            className="hover:text-indigo-600"
                          >
                            {suite.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {suite.type}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {suite.browser_type}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(
                            new Date(suite.created_at),
                            "yyyy/MM/dd HH:mm"
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/test-suites/${suite.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            編集
                          </Link>
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
    </div>
  );
}
