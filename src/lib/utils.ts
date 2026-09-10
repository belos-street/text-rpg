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
