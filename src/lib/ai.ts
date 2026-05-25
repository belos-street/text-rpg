import OpenAI from "openai";

function getClient(): OpenAI {
  const apiKey = getApiKey();
  const baseURL = process.env.AI_BASE_URL || "https://api.deepseek.com/v1";
  const isMimo = apiKey.startsWith("tp-");

  const opts: ConstructorParameters<typeof OpenAI>[0] = {
    baseURL,
  };

  if (isMimo) {
    opts.apiKey = "sk-placeholder";
    opts.defaultHeaders = { "api-key": apiKey };
    opts.fetch = (url: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.delete("authorization");
      return fetch(url, { ...init, headers });
    };
  } else if (apiKey) {
    opts.apiKey = apiKey;
  }

  return new OpenAI(opts);
}

function getModel(): string {
  return process.env.AI_MODEL || "deepseek-chat";
}

export async function* streamChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): AsyncGenerator<string> {
  const client = getClient();
  const model = getModel();

  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
    temperature: 0.9,
    max_tokens: 4096,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      yield content;
    }
  }
}

export function checkConfig(): boolean {
  return !!process.env.AI_BASE_URL;
}

export function getApiKey(): string {
  return process.env.AI_API_KEY || "";
}
