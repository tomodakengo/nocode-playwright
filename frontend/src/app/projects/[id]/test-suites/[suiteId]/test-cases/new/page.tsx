"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getTestSuite, createTestCase } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const stepSchema = z.object({
  action: z.string().min(1, "アクションを選択してください"),
  target: z.string().min(1, "ターゲットを入力してください"),
  value: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(1, "テストケース名を入力してください"),
  description: z.string(),
  steps: z
    .array(stepSchema)
    .min(1, "少なくとも1つのステップを追加してください"),
});

type FormData = z.infer<typeof formSchema>;

const actionTypes = [
  { value: "click", label: "クリック" },
  { value: "type", label: "テキスト入力" },
  { value: "navigate", label: "ページ移動" },
  { value: "select", label: "選択" },
  { value: "check", label: "チェック" },
  { value: "wait", label: "待機" },
];

export default function NewTestCasePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const suiteId = Number(params.suiteId);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      steps: [{ action: "", target: "", value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  const { data: suite, isLoading } = useQuery({
    queryKey: ["test-suite", suiteId],
    queryFn: () => getTestSuite(projectId, suiteId),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => createTestCase(projectId, suiteId, data),
    onSuccess: () => {
      router.push(`/projects/${projectId}/test-suites/${suiteId}`);
    },
  });

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync(data);
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
          <h1 className="text-3xl font-bold">新規テストケース作成</h1>
          <p className="text-gray-600 mt-2">{suite.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>テストケース情報</CardTitle>
            <CardDescription>
              テストケースの基本情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">テストケース名</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="テストケース名を入力"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="テストケースの説明を入力"
                />
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>テストステップ</CardTitle>
                <CardDescription>
                  実行するテストステップを追加してください
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ action: "", target: "", value: "" })}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                ステップを追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>アクション</Label>
                        <Select
                          onValueChange={(value) =>
                            setValue(`steps.${index}.action`, value)
                          }
                          defaultValue={field.action}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="アクションを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {actionTypes.map((action) => (
                              <SelectItem
                                key={action.value}
                                value={action.value}
                              >
                                {action.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.steps?.[index]?.action && (
                          <p className="text-sm text-red-500">
                            {errors.steps[index]?.action?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>ターゲット</Label>
                        <Input
                          {...register(`steps.${index}.target`)}
                          placeholder="要素のセレクタを入力"
                        />
                        {errors.steps?.[index]?.target && (
                          <p className="text-sm text-red-500">
                            {errors.steps[index]?.target?.message}
                          </p>
                        )}
                      </div>
                    </div>
                    {watch(`steps.${index}.action`) === "type" && (
                      <div className="space-y-2">
                        <Label>入力値</Label>
                        <Input
                          {...register(`steps.${index}.value`)}
                          placeholder="入力するテキストを入力"
                        />
                      </div>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => remove(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "作成"}
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-500">
            エラーが発生しました。もう一度お試しください。
          </p>
        )}
      </form>
    </div>
  );
}
