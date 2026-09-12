import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  try {
    const arr = new Uint8Array(10);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // 降级路径同样输出 20 位 hex，保证与存储层 id 校验（^[a-f0-9]{20}$）兼容
    let out = "";
    let seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) % 0x7fffffff;
    for (let i = 0; i < 5; i++) {
      seed = (seed * 1103515245 + 12345) % 0x7fffffff;
      out += seed.toString(16).padStart(6, "0").slice(0, 4);
    }
    return out;
  }
}

// FTS5 的默认分词器不切分中文，按相邻两字（bigram）建索引是成熟方案：
// 2 字角色名（如"莉娅"）也能作为完整 token 精确命中
const NOISE_CHARS =
  /[\s\u3000-\u303F\uFF00-\uFFEF!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~「」『』【】（）·……——""''、。！？：；]/g;

/** 去除标点空白后按相邻两字切分，空格连接（供 FTS5 索引与查询构造共用） */
export function toBigrams(text: string): string {
  const clean = text.replace(NOISE_CHARS, "");
  const tokens: string[] = [];
  for (let i = 0; i < clean.length - 1; i++) {
    tokens.push(clean.slice(i, i + 2));
  }
  return tokens.join(" ");
}
