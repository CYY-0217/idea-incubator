"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createIdeaAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { IdeaSource } from "@/lib/queries";

const MODES: Array<{
  value: IdeaSource;
  label: string;
  placeholder: string;
}> = [
  { value: "keyword", label: "关键词", placeholder: "比如：番茄计时" },
  {
    value: "text",
    label: "想法",
    placeholder:
      "比如：记录每个番茄钟在做什么，周末自动生成一份专注报告的小工具",
  },
  {
    value: "paste",
    label: "对话粘贴",
    placeholder:
      "把和朋友聊起某个点子的对话原样粘进来，AI 会先提炼核心想法再展开",
  },
];

export function IdeaInput() {
  const [mode, setMode] = useState<IdeaSource>("text");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const rawText = value.trim();
    if (!rawText) {
      toast.error("先写点什么再扔进来");
      return;
    }
    startTransition(async () => {
      const res = await createIdeaAction({ rawText, source: mode });
      if (res.ok) {
        setValue("");
        toast.success("已收进收件箱");
      } else {
        toast.error(res.error);
      }
    });
  }

  const active = MODES.find((m) => m.value === mode)!;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-1.5" role="tablist" aria-label="输入模式">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-pressed={m.value === mode}
            onClick={() => setMode(m.value)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-all duration-150 active:scale-95 ${
              m.value === mode
                ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                : "border-border/70 text-muted-foreground hover:-translate-y-px hover:border-border hover:bg-card hover:text-foreground hover:shadow-sm"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={active.placeholder}
        rows={3}
        className="resize-none bg-card text-sm shadow-card transition-shadow duration-200 focus-visible:shadow-card-hover"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground/60">
          ⌘/Ctrl + ↩ 发送
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="shadow-sm transition-all duration-150 active:scale-95"
        >
          {pending ? "收起中…" : "扔进收件箱"}
        </Button>
      </div>
    </form>
  );
}
