"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

const AVAILABLE_ACTIONS = [
  { value: "click", label: "クリック" },
  { value: "type", label: "テキスト入力" },
  { value: "waitForSelector", label: "要素の待機" },
  { value: "waitForTimeout", label: "時間待機" },
  { value: "goto", label: "ページ遷移" },
  { value: "press", label: "キー入力" },
  { value: "check", label: "チェックボックスの選択" },
  { value: "uncheck", label: "チェックボックスの解除" },
  { value: "select", label: "セレクトボックスの選択" },
  { value: "hover", label: "ホバー" },
  { value: "focus", label: "フォーカス" },
  { value: "blur", label: "フォーカス解除" },
];

export default function TestStepEditor() {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
      setSelectedStep(index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
      setSelectedStep(index + 1);
    }
  };

  const handleDuplicate = (index: number) => {
    const step = fields[index];
    append({
      ...step,
      description: `${step.description || ""} (コピー)`,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
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

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className={`border rounded-lg p-4 ${
              selectedStep === index ? "ring-2 ring-indigo-500" : ""
            }`}
            onClick={() => setSelectedStep(index)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">
                  ステップ {index + 1}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === fields.length - 1}
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(index)}
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={control}
                name={`steps.${index}.action`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>アクション</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">アクションを選択</option>
                        {AVAILABLE_ACTIONS.map((action) => (
                          <option key={action.value} value={action.value}>
                            {action.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      実行するアクションを選択してください。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`steps.${index}.xpath`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>XPath</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="要素を特定するXPathを入力"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() => {
                            // TODO: XPath選択ツールの実装
                          }}
                        >
                          要素を選択
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      操作対象の要素を特定するXPathを入力してください。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {field.action === "type" && (
                <FormField
                  control={control}
                  name={`steps.${index}.args.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>入力テキスト</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="入力するテキストを入力"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {field.action === "waitForTimeout" && (
                <FormField
                  control={control}
                  name={`steps.${index}.args.timeout`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>待機時間（ミリ秒）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="1000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={control}
                name={`steps.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明</FormLabel>
                    <FormControl>
                      <Input placeholder="ステップの説明を入力" {...field} />
                    </FormControl>
                    <FormDescription>
                      このステップの目的や動作を説明してください。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
