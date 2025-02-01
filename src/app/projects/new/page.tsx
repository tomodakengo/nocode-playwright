"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createProject } from "@/services/api";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "必須項目です"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      toast({
        title: "プロジェクトを作成しました",
        description: "プロジェクト一覧に戻ります",
      });
      router.push("/projects");
    },
    onError: (error) => {
      console.error("プロジェクト作成エラー:", error);
      toast({
        title: "エラーが発生しました",
        description:
          error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log("フォーム送信:", values);
    mutation.mutate(values);
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            新規プロジェクト作成
          </h2>
        </div>
      </div>

      <div className="mt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プロジェクト名</FormLabel>
                  <FormControl>
                    <Input placeholder="プロジェクト名を入力" {...field} />
                  </FormControl>
                  <FormDescription>
                    プロジェクトを識別するための名前を入力してください。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Input placeholder="プロジェクトの説明を入力" {...field} />
                  </FormControl>
                  <FormDescription>
                    プロジェクトの説明を入力してください。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/projects")}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "作成中..." : "作成"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {mutation.error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                エラーが発生しました
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "不明なエラーが発生しました"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
