"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { applyPanelAction, generatePanelAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Review = { persona: string; verdict: string; comment: string };
type PanelRow = { id: number; reviews: Review[]; origin: string; at: string };

const VERDICT_STYLE: Record<string, string> = {
  值得做: "border-transparent bg-primary/10 text-primary",
  再想想: "border-transparent bg-amber-500/10 text-amber-600",
  放弃: "border-transparent bg-stone-500/10 text-stone-500",
};

export function PanelSection({
  ideaId,
  panels,
  modelReady,
}: {
  ideaId: number;
  panels: PanelRow[];
  modelReady: boolean;
}) {
  const [phase, setPhase] = useState<"idle" | "working">("idle");
  const [zcodePrompt, setZcodePrompt] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [pending, startTransition] = useTransition();

  function generate() {
    setPhase("working");
    startTransition(async () => {
      const res = await generatePanelAction({ ideaId });
      if (!res.ok) {
        toast.error(res.error);
        setPhase("idle");
        return;
      }
      if (res.mode === "zcode") {
        setZcodePrompt(res.prompt);
      } else {
        toast.success("评审团已就位");
        setPhase("idle");
      }
    });
  }

  function apply() {
    startTransition(async () => {
      const res = await applyPanelAction({ ideaId, json: pasteValue });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("评审记录已归档");
      setZcodePrompt(null);
      setPasteValue("");
      setPhase("idle");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {panels.length > 0 && (
        <div className="flex flex-col gap-3">
          {panels.map((panel, pi) => (
            <div
              key={panel.id}
              className="grid gap-2.5 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-fill-mode:backwards]"
              style={{ animationDelay: `${pi * 80}ms` }}
            >
              {panel.reviews.map((r, ri) => (
                <div
                  key={ri}
                  className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card/85 p-3.5 shadow-card backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground/85">
                      {r.persona}
                    </span>
                    <Badge
                      variant="outline"
                      className={`rounded-full border-transparent px-2 text-[11px] ${VERDICT_STYLE[r.verdict] ?? "border-border text-muted-foreground"}`}
                    >
                      {r.verdict}
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {phase === "idle" && modelReady && (
        <Button
          size="sm"
          variant="outline"
          onClick={generate}
          className="w-fit shadow-sm transition-all duration-150 active:scale-95"
        >
          召开 AI 评审团
        </Button>
      )}

      {!modelReady && (
        <p className="text-sm text-muted-foreground">
          模型通道未接入，评审团暂缓。已归档的评审记录仍可查看。
        </p>
      )}

      {modelReady && zcodePrompt && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            未设置 DEEPSEEK_API_KEY：把 prompt 交给 ZCode，拿回
            <code className="mx-1 rounded bg-muted px-1 font-mono text-[11px]">
              {"{\"reviews\":[…]}"}
            </code>
            粘贴进来归档。
          </p>
          <pre className="max-h-48 overflow-auto rounded-xl border border-border/60 bg-card p-3 font-mono text-[11px] leading-relaxed">
            {zcodePrompt}
          </pre>
          <Textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder='粘贴 {"reviews":[…]}'
            rows={5}
            className="bg-card font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={apply} disabled={pending} className="active:scale-95">
              {pending ? "归档中…" : "归档评审"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setZcodePrompt(null);
                setPhase("idle");
              }}
              className="active:scale-95"
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
