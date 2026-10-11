"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { addAttachmentAction } from "@/app/actions";

type Att = { id: number; filePath: string };

export function AttachmentPanel({
  ideaId,
  attachments,
}: {
  ideaId: number;
  attachments: Att[];
}) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上传失败");
      startTransition(async () => {
        const r = await addAttachmentAction({ ideaId, filePath: data.path });
        if (r.ok) toast.success("截图已挂到这张卡上");
        else toast.error(r.error);
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || pending}
          className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <ImagePlus className="size-3.5" />
          {uploading ? "上传中…" : "添加截图"}
        </button>
        <span className="font-mono text-[11px] text-muted-foreground/60">
          PNG/JPEG/WebP/GIF ≤ 5MB
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          [...(e.target.files ?? [])].forEach((f) => void upload(f));
          e.target.value = "";
        }}
      />
      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">
          暂无。网页剪裁 ⌘C 后在收件箱 ⌘V 即可入库。
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.id}
              src={`/api/attachments/${a.id}`}
              alt="想法附件"
              className="h-28 rounded-lg border border-border object-cover shadow-card animate-in fade-in zoom-in-95 duration-300"
            />
          ))}
        </div>
      )}
    </div>
  );
}
