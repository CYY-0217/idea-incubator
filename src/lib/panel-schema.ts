import { z } from "zod";

export const VERDICTS = ["值得做", "再想想", "放弃"] as const;

export const panelReviewSchema = z.object({
  persona: z.string().min(1),
  verdict: z.enum(VERDICTS),
  comment: z.string().min(1),
});

export const panelPayloadSchema = z.object({
  reviews: z.array(panelReviewSchema).min(2),
});

export type PanelPayload = z.infer<typeof panelPayloadSchema>;

export function formatPanelError(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("；");
}
