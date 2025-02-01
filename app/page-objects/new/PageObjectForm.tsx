"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageObjectService } from "@/lib/services/pageObjectService";
import { Selector } from "@/lib/types/pageObject";

export function PageObjectForm() {
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await PageObjectService.createPageObject({
        name,
        url,
        selectors,
      });

      router.push("/page-objects");
    } catch (error) {
      console.error("Failed to create page object:", error);
    }
  };

  const addSelector = () => {
    setSelectors([...selectors, { name: "", type: "css", value: "" }]);
  };

  const updateSelector = (
    index: number,
    field: keyof Selector,
    value: string
  ) => {
    const newSelectors = [...selectors];
    newSelectors[index] = { ...newSelectors[index], [field]: value };
    setSelectors(newSelectors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="名前"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Input
        label="URL"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">セレクタ</h3>
          <Button type="button" onClick={addSelector} variant="outline">
            セレクタを追加
          </Button>
        </div>

        {selectors.map((selector, index) => (
          <div key={index} className="grid grid-cols-3 gap-4">
            <Input
              value={selector.name}
              onChange={(e) => updateSelector(index, "name", e.target.value)}
              placeholder="セレクタ名"
              required
            />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={selector.type}
              onChange={(e) =>
                updateSelector(index, "type", e.target.value as "css" | "xpath")
              }
              required
            >
              <option value="css">CSS</option>
              <option value="xpath">XPath</option>
            </select>
            <Input
              value={selector.value}
              onChange={(e) => updateSelector(index, "value", e.target.value)}
              placeholder="セレクタ値"
              required
            />
          </div>
        ))}
      </div>

      <Button type="submit">作成</Button>
    </form>
  );
}
