import "dotenv/config";

import {
  expandPayloadSchema,
  formatExpandError,
} from "../src/lib/expand-schema";
import { addIdeaVersion, getIdea } from "../src/lib/queries";
import { buildExpandPrompt, SYSTEM_PROMPT } from "./prompt";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

/** 容错提取 JSON：剥掉 markdown 围栏，取首尾大括号之间 */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("返回内容里没找到 JSON 对象");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

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
  const apiKey = process.env.DEEPSEEK_API_KEY;
  let content: string;

  if (apiKey) {
    console.error("→ 使用 DeepSeek API 展开…");
    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      console.error(`DeepSeek API 错误 ${res.status}: ${await res.text()}`);
      process.exit(1);
    }
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    content = data.choices[0].message.content;
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
    content = await readStdin();
  }

  let parsed: unknown;
  try {
    parsed = extractJson(content);
  } catch (e) {
    console.error(`JSON 解析失败: ${(e as Error).message}`);
    process.exit(1);
  }

  const result = expandPayloadSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`校验失败（按字段改好后重贴）：\n${formatExpandError(result.error)}`);
    process.exit(1);
  }

  const version = await addIdeaVersion({
    ideaId: id,
    payload: result.data,
    origin: apiKey ? "deepseek" : "zcode",
  });
  console.error(`✅ 已写入 v${version.vNo}（origin=${version.origin}）`);
  process.exit(0);
}

main();
