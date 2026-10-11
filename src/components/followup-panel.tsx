"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  applyMergedVersionAction,
  generateFollowupsAction,
  submitFollowupsAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type FollowupRow = { id: number; question: string; answer: string | null };
type Phase = "idle" | "asking" | "answering" | "merging";

export function FollowupPanel({
  ideaId,
  followups,
}: {
  ideaId: number;
  followups: FollowupRow[];
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [zcodePrompt, setZcodePrompt] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [pending, startTransition] = useTransition();

  function ask() {
    setPhase("asking");
    startTransition(async () => {
      const res = await generateFollowupsAction({ ideaId });
      if (!res.ok) {
        toast.error(res.error);
        setPhase("idle");
        return;
      }
      if (res.mode === "deepseek") {
        setQuestions(res.questions);
        setPhase("answering");
      } else {
        setZcodePrompt(res.prompt);
        setPhase("answering");
      }
    });
  }

  function parsePastedQuestions() {
    try {
      const parsed = JSON.parse(pasteValue) as { questions?: unknown };
      const raw = Array.isArray(parsed.questions) ? parsed.questions : [];
      const list = raw.map(String).filter(Boolean);
      if (list.length === 0) throw new Error("没有 questions 字段");
      setQuestions(list);
      setZcodePrompt(null);
      setPasteValue("");
    } catch (e) {
      toast.error(`解析失败：${(e as Error).message}`);
    }
  }

  function submit(refine: boolean) {
    const qas = questions
      .map((q, i) => ({ question: q, answer: answers[i] ?? "" }))
      .filter((qa) => qa.answer.trim());
    if (qas.length === 0) {
      toast.error("至少回答一个问题");
      return;
    }
    setPhase("merging");
    startTransition(async () => {
      const res = await submitFollowupsAction({ ideaId, qas, refine });
      if (!res.ok) {
        toast.error(res.error);
        setPhase("answering");
        return;
      }
      if (res.mode === "zcode") {
        setZcodePrompt(res.prompt);
        setPhase("merging");
        toast.success("回答已保存；把融合 prompt 交给 ZCode，贴回 JSON 即回流");
        return;
      }
      toast.success(refine ? `已回流为新版本 v${res.saved}` : "回答已保存");
      reset();
    });
  }

  function applyPasted() {
    startTransition(async () => {
      const res = await applyMergedVersionAction({ ideaId, json: pasteValue });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`已回流为新版本 v${res.vNo}`);
      reset();
    });
  }

  function reset() {
    setPhase("idle");
    setQuestions([]);
    setAnswers({});
    setZcodePrompt(null);
    setPasteValue("");
  }

  return (
    <div className="flex flex-col gap-3">
      {followups.length > 0 && (
        <ul className="flex flex-col gap-2">
          {followups.map((f) => (
            <li
              key={f.id}
              className="rounded-lg border border-border/60 bg-card p-3 shadow-card"
            >
              <p className="text-sm font-medium">{f.question}</p>
              {f.answer && (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {f.answer}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {phase === "idle" && (
        <Button
          size="sm"
          variant="outline"
          onClick={ask}
          className="w-fit shadow-sm transition-all duration-150 active:scale-95"
        >
          AI 追问 3 个问题
        </Button>
      )}

      {phase === "answering" && zcodePrompt && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            未设置 DEEPSEEK_API_KEY：把下面的 prompt 交给 ZCode，拿回
            <code className="mx-1 rounded bg-muted px-1 font-mono text-[11px]">
              {"{\"questions\":[…]}"}
            </code>
            粘贴进来。
          </p>
          <pre className="max-h-40 overflow-auto rounded-lg border border-border/60 bg-card p-3 font-mono text-[11px] leading-relaxed">
            {zcodePrompt}
          </pre>
          <Textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder='粘贴 {"questions":[…]}'
            rows={3}
            className="bg-card font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={parsePastedQuestions} className="active:scale-95">
              解析问题
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} className="active:scale-95">
              取消
            </Button>
          </div>
        </div>
      )}

      {phase === "answering" && questions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {questions.map((q, i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card p-3 shadow-card"
            >
              <p className="text-sm font-medium">
                <span className="mr-1.5 font-mono text-[11px] text-primary">
                  Q{i + 1}
                </span>
                {q}
              </p>
              <Textarea
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                placeholder="你的回答…"
                rows={2}
                className="resize-none bg-background text-sm"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => submit(true)}
              disabled={pending}
              className="transition-all duration-150 active:scale-95"
            >
              {pending ? "融合中…" : "保存并回流新版本"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => submit(false)}
              disabled={pending}
              className="transition-all duration-150 active:scale-95"
            >
              只保存回答
            </Button>
          </div>
        </div>
      )}

      {phase === "merging" && zcodePrompt && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            把融合 prompt 交给 ZCode，拿回九字段 JSON 粘贴进来，写为 v(n+1)。
          </p>
          <pre className="max-h-48 overflow-auto rounded-lg border border-border/60 bg-card p-3 font-mono text-[11px] leading-relaxed">
            {zcodePrompt}
          </pre>
          <Textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder="粘贴融合后的九字段 JSON"
            rows={5}
            className="bg-card font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={applyPasted}
              disabled={pending}
              className="transition-all duration-150 active:scale-95"
            >
              {pending ? "写入中…" : "写入新版本"}
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} className="active:scale-95">
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
