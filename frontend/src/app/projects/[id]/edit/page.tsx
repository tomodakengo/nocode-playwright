"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { getProject, updateProject } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(1, "プロジェクト名を入力してください"),
  description: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    values: project
      ? {
          name: project.name,
          description: project.description,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => updateProject(projectId, data),
    onSuccess: () => {
      router.push(`/projects/${projectId}`);
    },
  });

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-10">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-muted-foreground">
            プロジェクトが見つかりませんでした。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">プロジェクトの編集</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">プロジェクト名</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="プロジェクト名を入力"
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
              placeholder="プロジェクトの説明を入力"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

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
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-500">
              エラーが発生しました。もう一度お試しください。
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
