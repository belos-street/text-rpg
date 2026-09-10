import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { loadStoryConfig } from "./game-data";

function getApiKey(): string {
  return process.env.AI_API_KEY || "";
}

function getModel(): string {
  return process.env.AI_MODEL || "deepseek-chat";
}

function getReasoningEffort(): "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | undefined {
  const value = process.env.AI_REASONING;
  if (!value) return undefined;
  return value as "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
}

function isLocalBaseUrl(): boolean {
  try {
    const url = new URL(process.env.AI_BASE_URL || "https://api.deepseek.com/v1");
    return ["127.0.0.1", "localhost", "::1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
}

// AI_STRUCTURED: "auto"（默认，仅本地端点启用）| "on" | "off"
function structuredOutputEnabled(): boolean {
  const mode = (process.env.AI_STRUCTURED || "auto").toLowerCase();
  if (mode === "off") return false;
  if (mode === "on") return true;
  return isLocalBaseUrl();
}

function getClient(): OpenAI {
  const apiKey = getApiKey();
  const baseURL = process.env.AI_BASE_URL || "https://api.deepseek.com/v1";
  const isMimo = apiKey.startsWith("tp-");

  const opts: ConstructorParameters<typeof OpenAI>[0] = {
    baseURL,
    // 本地模型服务（Ollama/LM Studio）不校验 key；占位值兜底避免 SDK 因缺失 key 直接抛错
    apiKey: apiKey || "local-model",
    // 本地模型 JIT 冷启动可能较慢；超时 + 有限重试，避免玩家端无限"思考中"
    timeout: 120_000,
    maxRetries: 1,
  };

  if (isMimo) {
    opts.defaultHeaders = { "api-key": apiKey };
    opts.fetch = (url: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.delete("authorization");
      return fetch(url, { ...init, headers });
    };
  }

  return new OpenAI(opts);
}

// ---------- 结构化输出（D1） ----------

let cachedJsonSchema: Record<string, unknown> | null = null;
let cachedSchemaFingerprint = -1;

// config.json 变更时自动重建 schema（无需重启开发服务器）
function configSchemaFingerprint(): number {
  try {
    return fs.statSync(
      path.join(process.cwd(), "game-data", "00_故事配置", "config.json"),
    ).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * 从故事配置构建 game_update 的 JSON Schema。
 * affectionChanges 的 key 枚举全部合法角色 ID（可选输出）——从语法层面杜绝
 * "用角色名当 key"（原 No.3）和编造 ID 的问题；只要求输出确实变化的角色，
 * 避免每回合回显 19 个全 0 键值对的 token 浪费。
 */
export function getGameUpdateJsonSchema(): Record<string, unknown> {
  const fingerprint = configSchemaFingerprint();
  if (cachedJsonSchema && cachedSchemaFingerprint === fingerprint) {
    return cachedJsonSchema;
  }
  cachedSchemaFingerprint = fingerprint;
  const config = loadStoryConfig();

  const affectionProperties: Record<string, unknown> = {};
  for (const relation of config.initialRelations) {
    affectionProperties[relation.characterId] = { type: "integer" };
  }

  const stringObject = (keys: string[]) => ({
    type: "object",
    properties: Object.fromEntries(keys.map((key) => [key, { type: "string" }])),
    required: keys,
    additionalProperties: false,
  });

  // B8：章节枚举——LLM 只能输出配置中的章节
  const chapterEnum = config.chapters?.length
    ? { enum: config.chapters }
    : { type: "string" };
  // B5：flags 白名单——只允许输出配置中声明的标记（可选字段，未声明则不可输出）
  const flagsProperties: Record<string, unknown> = {};
  for (const flagId of Object.keys(config.flags ?? {})) {
    flagsProperties[flagId] = { type: "boolean" };
  }

  cachedJsonSchema = {
    type: "object",
    properties: {
      type: { enum: ["game_update"] },
      narration: { type: "string" },
      choices: {
        type: "array",
        items: stringObject(["id", "text"]),
        minItems: 2,
        maxItems: 4,
      },
      stateChanges: {
        type: "object",
        properties: {
          hp: { type: "integer", minimum: 0 },
          mp: { type: "integer", minimum: 0 },
          gold: { type: "integer", minimum: 0 },
          location: { type: "string" },
          chapter: chapterEnum,
          day: { type: "integer", minimum: 1 },
          time: { type: "string" },
        },
        required: ["hp", "mp", "gold", "location", "chapter", "day", "time"],
        additionalProperties: false,
      },
      affectionChanges: {
        type: "object",
        properties: affectionProperties,
        // key 白名单限制但全部可选：模型只输出确实变化的角色（实测省 ~100 tokens/回合）
        additionalProperties: false,
      },
      affectionReason: { type: "string" },
      flagsChanges: {
        type: "object",
        properties: flagsProperties,
        additionalProperties: false,
      },
      harmonyChange: { type: "integer" },
      newMemory: {
        type: "object",
        properties: {
          type: { enum: ["event", "decision", "item", "relationship"] },
          content: { type: "string" },
          importance: { type: "integer", minimum: 1, maximum: 10 },
        },
        required: ["type", "content", "importance"],
        additionalProperties: false,
      },
      newItems: { type: "array", items: stringObject(["id", "name"]) },
      scene: stringObject(["mood", "weather", "time"]),
      ending: { type: "string" },
    },
    required: [
      "type",
      "narration",
      "choices",
      "stateChanges",
      "affectionChanges",
      "harmonyChange",
      "newMemory",
      "newItems",
      "scene",
    ],
    additionalProperties: false,
  };
  return cachedJsonSchema;
}

async function openStream(
  client: OpenAI,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: { structured: boolean },
) {
  const model = getModel();
  const reasoningEffort = isLocalBaseUrl() ? getReasoningEffort() : undefined;

  return client.chat.completions.create({
    model,
    messages,
    stream: true as const,
    temperature: 0.9,
    max_tokens: 4096,
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    ...(options.structured
      ? {
          response_format: {
            type: "json_schema" as const,
            json_schema: {
              name: "game_update",
              strict: true,
              schema: getGameUpdateJsonSchema(),
            },
          },
        }
      : {}),
  });
}

export async function* streamChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): AsyncGenerator<string> {
  const client = getClient();
  const structured = structuredOutputEnabled();

  let stream;
  try {
    stream = await openStream(client, messages, { structured });
  } catch (error) {
    if (!structured) throw error;
    // 端点不支持 json_schema 时降级重试一次（zod 校验层仍在兜底）
    console.warn(
      "[ai] 结构化输出请求失败，降级为普通模式:",
      error instanceof Error ? error.message : error,
    );
    stream = await openStream(client, messages, { structured: false });
  }

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
