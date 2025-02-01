"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as z from "zod";
import { createTestSuite } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "テストスイート名を入力してください"),
  description: z.string(),
  browser_type: z.enum(["chromium", "firefox", "webkit"], {
    required_error: "ブラウザを選択してください",
  }),
  base_url: z.string().url("有効なURLを入力してください"),
});

type FormData = z.infer<typeof formSchema>;

export default function NewTestSuitePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      browser_type: "chromium",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => createTestSuite(projectId, data),
    onSuccess: () => {
      router.push(`/projects/${projectId}`);
    },
  });

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">新規テストスイート作成</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">テストスイート名</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="テストスイート名を入力"
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
              placeholder="テストスイートの説明を入力"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="browser_type">ブラウザ</Label>
            <Select
              onValueChange={(value) => setValue("browser_type", value as any)}
              defaultValue="chromium"
            >
              <SelectTrigger>
                <SelectValue placeholder="ブラウザを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chromium">Chromium</SelectItem>
                <SelectItem value="firefox">Firefox</SelectItem>
                <SelectItem value="webkit">WebKit</SelectItem>
              </SelectContent>
            </Select>
            {errors.browser_type && (
              <p className="text-sm text-red-500">
                {errors.browser_type.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_url">ベースURL</Label>
            <Input
              id="base_url"
              {...register("base_url")}
              placeholder="https://example.com"
              type="url"
            />
            {errors.base_url && (
              <p className="text-sm text-red-500">{errors.base_url.message}</p>
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
    </div>
  );
}
