import { z } from "zod";

// LLM 常把评分输出成字符串，这里温和地纠正一次
const score = z.preprocess(
  (v) => (typeof v === "string" ? Number(v) : v),
  z.number().int().min(1).max(5),
);

export const expandPayloadSchema = z.object({
  restated: z.string().min(1),
  problem: z.string().min(1),
  output_form: z.string().min(1),
  alternatives: z.string().min(1),
  edge: z.string().min(1),
  first_step: z.string().min(1),
  novelty: score,
  feasibility: score,
  risk: z.string().min(1),
});

export type ExpandPayload = z.infer<typeof expandPayloadSchema>;

/** 把 zod 报错压成一行人类可读的「字段名: 原因」清单，喂回给 ZCode/用户重贴 */
export function formatExpandError(error: z.ZodError): string {
  return error.issues
    .map((i) => `字段 ${i.path.join(".")}: ${i.message}`)
    .join("；");
}
