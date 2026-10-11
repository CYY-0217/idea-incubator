import "dotenv/config";

/** 是否配置了 DeepSeek API key（决定走 API 通道还是 ZCode 代跑通道） */
export function hasDeepSeekKey(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

/** 从 LLM 返回文本中容错提取 JSON：剥 markdown 围栏，取首尾大括号 */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("返回内容里没找到 JSON 对象");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

/** DeepSeek chat completion，强制 JSON 输出。无 key 时抛错（调用方先用 hasDeepSeekKey 分流） */
export async function callDeepSeekJSON(
  system: string,
  user: string,
): Promise<unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY 未设置");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    throw new Error(`DeepSeek API 错误 ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return extractJson(data.choices[0].message.content);
}
