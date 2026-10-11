import "dotenv/config";

import { callDeepSeekJSON, extractJson, hasDeepSeekKey } from "../src/lib/ai";
import {
  expandPayloadSchema,
  formatExpandError,
} from "../src/lib/expand-schema";
import { addIdeaVersion, getIdea } from "../src/lib/queries";
import {
  buildExpandPrompt,
  SYSTEM_PROMPT,
} from "../src/lib/prompt";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const id = Number(process.argv[2]);
  if (!Number.isInteger(id) || id <= 0) {
    console.error("用法: pnpm idea:expand <ideaId>");
    process.exit(1);
  }

  const detail = await getIdea(id);
  if (!detail) {
    console.error(`找不到想法 #${id}`);
    process.exit(1);
  }

  const userPrompt = buildExpandPrompt({
    rawText: detail.idea.rawText,
    source: detail.idea.source,
  });

  let parsed: unknown;
  if (hasDeepSeekKey()) {
    console.error("→ 使用 DeepSeek API 展开…");
    parsed = await callDeepSeekJSON(SYSTEM_PROMPT, userPrompt);
  } else {
    // ZCode 通道：prompt 打到 stdout，JSON 从 stdin 读（支持管道），零 API token
    console.log("=== SYSTEM ===");
    console.log(SYSTEM_PROMPT);
    console.log("\n=== USER ===");
    console.log(userPrompt);
    console.error(
      "\n未设置 DEEPSEEK_API_KEY，走 ZCode 通道：把上面的 SYSTEM+USER 交给 ZCode，" +
        "拿回 JSON 后粘贴到本进程的标准输入（支持管道喂入），Ctrl-D 结束。\n",
    );
    console.error("=== 等待 stdin 的 JSON ===");
    const content = await readStdin();
    parsed = extractJson(content);
  }

  const result = expandPayloadSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`校验失败（按字段改好后重贴）：\n${formatExpandError(result.error)}`);
    process.exit(1);
  }

  const version = await addIdeaVersion({
    ideaId: id,
    payload: result.data,
    origin: hasDeepSeekKey() ? "deepseek" : "zcode",
  });
  console.error(`✅ 已写入 v${version.vNo}（origin=${version.origin}）`);
  process.exit(0);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
