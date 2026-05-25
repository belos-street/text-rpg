import type { AffectionStage } from "@/types";

export function getAffectionStageLabel(
  affection: number,
  stages: AffectionStage[],
): string {
  for (const stage of stages) {
    if (affection <= stage.max) return stage.label;
  }
  return stages[stages.length - 1]?.label || "未知";
}

export function getActionDescription(
  affection: number,
  stages: AffectionStage[],
): string[] {
  for (const stage of stages) {
    if (affection <= stage.max) return stage.actionDescriptions;
  }
  return stages[stages.length - 1]?.actionDescriptions || [];
}
