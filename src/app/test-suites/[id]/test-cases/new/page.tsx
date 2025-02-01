"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createTestCase } from "@/services/api";
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
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const testStepSchema = z.object({
  action: z.string().min(1, "必須項目です"),
  xpath: z.string().min(1, "必須項目です"),
  args: z.record(z.any()).nullable(),
  description: z.string().nullable(),
});

const testResultSchema = z.object({
  selector: z.string().min(1, "必須項目です"),
  expected_value: z.any(),
  comparison_type: z.string().min(1, "必須項目です"),
});

const formSchema = z.object({
  name: z.string().min(1, "必須項目です"),
  description: z.string().optional(),
  priority: z.number().min(1).max(5),
  steps: z.array(testStepSchema).min(1, "少なくとも1つのステップが必要です"),
  expected_results: z.array(testResultSchema).optional(),
  screenshot_timing: z.string(),
  is_enabled: z.boolean(),
  dependencies: z.array(z.number()).optional(),
  before_each: z.array(testStepSchema).optional(),
  after_each: z.array(testStepSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTestCasePage() {
  const params = useParams();
  const router = useRouter();
  const testSuiteId = Number(params.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: 3,
      steps: [{ action: "", xpath: "", args: null, description: null }],
      expected_results: [],
      screenshot_timing: "on_error",
      is_enabled: true,
      dependencies: [],
      before_each: [],
      after_each: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => createTestCase(testSuiteId, data),
    onSuccess: () => {
      router.push(`/test-suites/${testSuiteId}`);
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            新規テストケース作成
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
                  <FormLabel>テストケース名</FormLabel>
                  <FormControl>
                    <Input placeholder="テストケース名を入力" {...field} />
                  </FormControl>
                  <FormDescription>
                    テストケースを識別するための名前を入力してください。
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
                    <Input placeholder="テストケースの説明を入力" {...field} />
                  </FormControl>
                  <FormDescription>
                    テストケースの説明を入力してください。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>優先度</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    テストケースの優先度を1-5で入力してください。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex items-center justify-between">
                <FormLabel>テストステップ</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      action: "",
                      xpath: "",
                      args: null,
                      description: null,
                    })
                  }
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  ステップを追加
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex gap-4 items-start border rounded-lg p-4"
                  >
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name={`steps.${index}.action`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>アクション</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="click, type, waitForなど"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`steps.${index}.xpath`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>XPath</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="要素を特定するXPathを入力"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`steps.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>説明</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ステップの説明を入力"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="screenshot_timing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>スクリーンショットのタイミング</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="never">撮影しない</option>
                      <option value="on_error">エラー時のみ</option>
                      <option value="always">常に撮影</option>
                    </select>
                  </FormControl>
                  <FormDescription>
                    スクリーンショットを撮影するタイミングを選択してください。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>有効</FormLabel>
                    <FormDescription>
                      テストケースを有効にするかどうかを選択してください。
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/test-suites/${testSuiteId}`)}
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
    </div>
  );
}
