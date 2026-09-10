import fs from "fs";
import path from "path";

/**
 * C6 结局图鉴：跨存档的全局进度（data/global.json）。
 * 记录已解锁结局，供标题屏展示与复玩激励。
 */

export interface GlobalProgress {
  unlockedEndings: string[];
  updatedAt: string;
}

function progressPath(): string {
  const dir = process.env.STORAGE_DATA_DIR || path.join(process.cwd(), "data");
  return path.join(dir, "global.json");
}

export function getGlobalProgress(): GlobalProgress {
  try {
    const raw = fs.readFileSync(progressPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<GlobalProgress>;
    return {
      unlockedEndings: Array.isArray(parsed.unlockedEndings)
        ? parsed.unlockedEndings
        : [],
      updatedAt: parsed.updatedAt ?? "",
    };
  } catch {
    return { unlockedEndings: [], updatedAt: "" };
  }
}

export function unlockEnding(endingId: string): GlobalProgress {
  const progress = getGlobalProgress();
  if (!progress.unlockedEndings.includes(endingId)) {
    progress.unlockedEndings.push(endingId);
  }
  progress.updatedAt = new Date().toISOString();
  const filePath = progressPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(progress, null, 2), "utf-8");
  return progress;
}
