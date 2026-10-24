"use client";

import { ClipboardCopy, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { applyMergedVersionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildExpandPrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import type { IdeaSource } from "@/lib/queries";

/**
 * 站内展开：不依赖 API key。
 * 复制 Prompt → 任意 AI 粘贴 → 把 JSON 贴回来 → 落成 v1 版本。
 */
export function ExpandPanel({
  ideaId,
  rawText,
  source,
}: {
  ideaId: number;
  rawText: string;
  source: IdeaSource;
}) {
  const router = useRouter();
  const [json, setJson] = useState("");
  const [pending, startTransition] = useTransition();

  const userPrompt = buildExpandPrompt({ rawText, source });
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(fullPrompt);
      toast.success("Prompt 已复制，去任意 AI 粘贴");
    } catch {
      toast.error("复制失败，展开下方文本手动复制");
    }
  }

  function submit() {
    if (!json.trim()) {
      toast.error("先粘贴 AI 返回的 JSON");
      return;
    }
    startTransition(async () => {
      const res = await applyMergedVersionAction({ ideaId, json });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`已生成 v${res.vNo}`);
      setJson("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-primary" />
          <span className="font-heading">把它展开成九字段</span>
        </div>
        <Button variant="outline" size="sm" onClick={copyPrompt}>
          <ClipboardCopy className="size-3.5" />
          复制 Prompt
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        1. 复制 Prompt，交给任意 AI（DeepSeek / ChatGPT / Claude 均可）；
        2. 把它返回的 JSON 原样粘到下面，提交后生成 v1 演化节点。
      </p>

      <details className="group">
        <summary className="w-fit cursor-pointer text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          查看 / 手动复制 Prompt
        </summary>
        <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
          {fullPrompt}
        </pre>
      </details>

      <Textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder='粘贴形如 {"restated": "...", "problem": "...", ...} 的 JSON'
        className="min-h-24 resize-y font-mono text-xs"
      />

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground/70">
          字段缺失会提示具体字段名，可改完后重贴
        </span>
        <Button onClick={submit} disabled={pending} size="sm">
          {pending ? "校验中…" : "生成 v1"}
        </Button>
      </div>
    </div>
  );
}
