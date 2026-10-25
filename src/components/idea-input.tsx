"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { createIdeaAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PLACEHOLDER = "一个词、一句话、一段对话——想记什么就写什么";

type Pending = { path: string | null; preview: string; uploading: boolean };

export function IdeaInput() {
  const [value, setValue] = useState("");
  const [pendingList, setPendingList] = useState<Pending[]>([]);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploading = pendingList.some((p) => p.uploading);

  async function uploadFile(file: File) {
    const item: Pending = {
      path: null,
      preview: URL.createObjectURL(file),
      uploading: true,
    };
    setPendingList((prev) => [...prev, item]);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上传失败");
      setPendingList((prev) =>
        prev.map((p) =>
          p.preview === item.preview ? { ...p, path: data.path, uploading: false } : p,
        ),
      );
    } catch (e) {
      setPendingList((prev) => prev.filter((p) => p.preview !== item.preview));
      toast.error((e as Error).message);
    }
  }

  function submit() {
    const rawText = value.trim();
    if (!rawText) {
      toast.error("先写点什么再扔进来");
      return;
    }
    if (uploading) {
      toast.error("截图还在上传");
      return;
    }
    const paths = pendingList.map((p) => p.path).filter((p): p is string => !!p);
    startTransition(async () => {
      const res = await createIdeaAction({ rawText, source: "text", attachmentPaths: paths });
      if (res.ok) {
        setValue("");
        setPendingList([]);
        toast.success(paths.length > 0 ? "已收进收件箱（含截图）" : "已收进收件箱");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onPaste={(e) => {
        const file = [...e.clipboardData.files].find((f) =>
          f.type.startsWith("image/"),
        );
        if (file) {
          e.preventDefault();
          void uploadFile(file);
          toast.success("截图已捕获");
        }
      }}
      className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/85 p-4 shadow-card backdrop-blur-sm"
    >
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={3}
        className="resize-none border-border/50 bg-background/60 text-sm shadow-none transition-shadow duration-200 focus-visible:shadow-card-hover"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      {pendingList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendingList.map((p) => (
            <div key={p.preview} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.preview}
                alt="待上传截图"
                className={`h-16 rounded-md border border-border object-cover ${p.uploading ? "opacity-50" : ""}`}
              />
              <button
                type="button"
                aria-label="移除截图"
                onClick={() =>
                  setPendingList((prev) => prev.filter((x) => x.preview !== p.preview))
                }
                className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground text-background shadow-sm transition-transform active:scale-90"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground/60">
            ⌘/Ctrl + ↩ 发送
          </span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ImagePlus className="size-3.5" />
            截图（或直接 ⌘V 粘贴）
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              files.forEach((f) => void uploadFile(f));
              e.target.value = "";
            }}
          />
        </div>
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
