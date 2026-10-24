"use client";

import { CalendarRange, LayoutGrid, Network, PenLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { createIdeaAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { IdeaSource } from "@/lib/queries";

const MODES: Array<{ value: IdeaSource; label: string; hint: string }> = [
  { value: "keyword", label: "关键词", hint: "一个词也能收" },
  { value: "text", label: "想法", hint: "一句话说清" },
  { value: "paste", label: "对话粘贴", hint: "原样粘进来" },
];

const NAV = [
  { href: "/board", label: "看板", icon: LayoutGrid },
  { href: "/graph", label: "图谱", icon: Network },
  { href: "/review", label: "周回顾", icon: CalendarRange },
];

const OPEN_EVENT = "open-idea-palette";

/** 页头入口：点击等价于按 ⌘K */
export function PaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      <PenLine className="size-3" />
      捕获
      <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<IdeaSource>("text");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => areaRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  const submit = useCallback(() => {
    const raw = value.trim();
    if (!raw) {
      toast.error("先写点什么再收");
      areaRef.current?.focus();
      return;
    }
    startTransition(async () => {
      const res = await createIdeaAction({ rawText: raw, source: mode });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("已收进收件箱");
      setValue("");
      setOpen(false);
      router.refresh();
    });
  }, [mode, router, value]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="flex items-center gap-2 font-heading text-base font-medium">
          <PenLine className="size-4 text-primary" />
          快速捕获
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          随时记下一闪而过的念头，先收进来，展开留给之后
        </DialogDescription>

        <div className="flex gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                mode === m.value
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              title={m.hint}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Textarea
          ref={areaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            mode === "keyword"
              ? "比如：番茄计时"
              : mode === "paste"
                ? "把对话原样粘进来…"
                : "比如：记录每个番茄钟在做什么，周末生成专注报告"
          }
          className="min-h-28 resize-none"
        />

        {value.trim() === "" && (
          <div className="flex flex-wrap items-center gap-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <n.icon className="size-3" />
                {n.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground/70">
            ⌘K 开关 · Esc 关闭 · ⌘↵ 提交
          </span>
          <Button onClick={submit} disabled={pending} size="sm">
            {pending ? "收进…" : "收进收件箱"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
