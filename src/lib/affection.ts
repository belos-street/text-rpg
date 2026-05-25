import type { AffectionStage } from "@/types";

export const AFFECTION_STAGES: Record<
  string,
  { min: number; max: number; label: string }
> = {
  stranger: { min: 0, max: 20, label: "陌生人" },
  acquainted: { min: 21, max: 40, label: "认识" },
  friend: { min: 41, max: 60, label: "朋友" },
  intimate: { min: 61, max: 80, label: "暧昧" },
  close: { min: 81, max: 95, label: "亲密" },
  lover: { min: 96, max: 100, label: "恋人" },
};

export function getAffectionStage(affection: number): string {
  for (const [key, range] of Object.entries(AFFECTION_STAGES)) {
    if (affection >= range.min && affection <= range.max) {
      return key;
    }
  }
  return "stranger";
}

export function getAffectionStageLabel(
  affection: number,
  stages: AffectionStage[],
): string {
  for (const stage of stages) {
    if (affection <= stage.max) return stage.label;
  }
  return stages[stages.length - 1]?.label || "未知";
}
