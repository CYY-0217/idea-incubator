"use client";

import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveManualVersionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const FIELDS: Array<{
  key: string;
  label: string;
  hint: string;
  rows: number;
  optional?: boolean;
}> = [
  { key: "restated", label: "一句话重述", hint: "这个想法到底是什么", rows: 2 },
  { key: "problem", label: "问题与场景", hint: "给谁用、在什么场景下用", rows: 3 },
  { key: "output_form", label: "产出形式与路线", hint: "做成什么，从想法到成品分几步", rows: 3 },
  {
    key: "alternatives",
    label: "已有类似物",
    hint: "人们现在怎么凑合；不确定就写「未查证」",
    rows: 2,
    optional: true,
  },
  { key: "edge", label: "差异点", hint: "为什么值得做", rows: 2, optional: true },
  { key: "first_step", label: "最小第一步", hint: "小到 1-2 个晚上能做完", rows: 2 },
  { key: "risk", label: "风险提示", hint: "一句不客气的话", rows: 2, optional: true },
];

function ScoreSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`size-8 rounded-lg border font-mono text-sm transition-colors ${
              value === n
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </label>
  );
}

/** 手动建档：不依赖任何外部 AI，自己把九字段写下来 */
export function ExpandPanel({ ideaId }: { ideaId: number }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({
    restated: "",
    problem: "",
    output_form: "",
    alternatives: "",
    edge: "",
    first_step: "",
    risk: "",
  });
  const [novelty, setNovelty] = useState(3);
  const [feasibility, setFeasibility] = useState(3);
  const [pending, startTransition] = useTransition();

  function set(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function submit() {
    for (const f of FIELDS) {
      if (!f.optional && !values[f.key]?.trim()) {
        toast.error(`「${f.label}」还没写`);
        return;
      }
    }
    startTransition(async () => {
      const res = await saveManualVersionAction({
        ideaId,
        payload: {
          ...values,
          alternatives: values.alternatives.trim() || "未查证",
          edge: values.edge.trim() || "待补",
          risk: values.risk.trim() || "待补",
          novelty,
          feasibility,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`已保存 v${res.vNo}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <PenLine className="size-4 text-primary" />
        <span className="font-heading text-lg font-medium">手动建档</span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        先把你已经想清楚的部分写下来，不确定的可以留空（标了「可选」的会自动填「待补」）。
        写下的内容会成为一个版本节点，之后随时可以再改。
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              {f.label}
              {f.optional && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">可选</span>
              )}
            </span>
            <Textarea
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.hint}
              rows={f.rows}
              className="resize-none text-sm"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-8">
        <ScoreSelect label="新颖性" value={novelty} onChange={setNovelty} />
        <ScoreSelect label="可行性" value={feasibility} onChange={setFeasibility} />
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={submit} disabled={pending} size="lg">
          {pending ? "保存中…" : "保存为 v1"}
        </Button>
      </div>
    </div>
  );
}
