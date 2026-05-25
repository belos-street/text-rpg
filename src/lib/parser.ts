import type { Choice, GameUpdate } from "@/types";

export function parseGameUpdate(text: string): GameUpdate | null {
  const jsonMatch = text.match(/\{[\s\S]*"type"\s*:\s*"game_update"[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as GameUpdate;
  } catch {
    return null;
  }
}

export function extractNarration(text: string): string {
  try {
    const startIdx = text.indexOf("{");
    if (startIdx === -1) return text;
    let depth = 0;
    let jsonEnd = -1;
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          jsonEnd = i;
          break;
        }
      }
    }
    if (jsonEnd === -1) return text;
    const jsonStr = text.slice(startIdx, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    if (parsed.narration) return parsed.narration;
  } catch {}
  const cleaned = text
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim();
  return cleaned || text;
}

export function extractChoices(text: string): Choice[] {
  try {
    const startIdx = text.indexOf("{");
    if (startIdx === -1) return [];
    let depth = 0;
    let jsonEnd = -1;
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          jsonEnd = i;
          break;
        }
      }
    }
    if (jsonEnd === -1) return [];
    const jsonStr = text.slice(startIdx, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    if (parsed.choices && Array.isArray(parsed.choices)) return parsed.choices;
  } catch {}
  return [];
}
