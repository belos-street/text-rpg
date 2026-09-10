import { describe, test, expect } from "bun:test";
import { getAffectionStage, getAffectionStageLabel } from "./affection";
import type { AffectionStage } from "@/types";

describe("getAffectionStage", () => {
  test("阶段边界值", () => {
    expect(getAffectionStage(0)).toBe("stranger");
    expect(getAffectionStage(20)).toBe("stranger");
    expect(getAffectionStage(21)).toBe("acquainted");
    expect(getAffectionStage(40)).toBe("acquainted");
    expect(getAffectionStage(41)).toBe("friend");
    expect(getAffectionStage(60)).toBe("friend");
    expect(getAffectionStage(61)).toBe("intimate");
    expect(getAffectionStage(80)).toBe("intimate");
    expect(getAffectionStage(81)).toBe("close");
    expect(getAffectionStage(95)).toBe("close");
    expect(getAffectionStage(96)).toBe("lover");
    expect(getAffectionStage(100)).toBe("lover");
  });

  test("越界与非法输入回退 stranger", () => {
    expect(getAffectionStage(-1)).toBe("stranger");
    expect(getAffectionStage(101)).toBe("stranger");
    expect(getAffectionStage(Number.NaN)).toBe("stranger");
  });
});

describe("getAffectionStageLabel", () => {
  const stages: AffectionStage[] = [
    { max: 20, label: "陌生人", actionDescriptions: [] },
    { max: 40, label: "认识", actionDescriptions: [] },
    { max: 60, label: "朋友", actionDescriptions: [] },
    { max: 80, label: "暧昧", actionDescriptions: [] },
    { max: 95, label: "亲密", actionDescriptions: [] },
    { max: 100, label: "恋人", actionDescriptions: [] },
  ];

  test("按区间返回文案", () => {
    expect(getAffectionStageLabel(0, stages)).toBe("陌生人");
    expect(getAffectionStageLabel(20, stages)).toBe("陌生人");
    expect(getAffectionStageLabel(21, stages)).toBe("认识");
    expect(getAffectionStageLabel(80, stages)).toBe("暧昧");
    expect(getAffectionStageLabel(81, stages)).toBe("亲密");
    expect(getAffectionStageLabel(96, stages)).toBe("恋人");
  });

  test("超出最后一档时取最后一档文案", () => {
    expect(getAffectionStageLabel(150, stages)).toBe("恋人");
  });

  test("空阶段表返回未知", () => {
    expect(getAffectionStageLabel(50, [])).toBe("未知");
  });
});
