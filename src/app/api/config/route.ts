import { loadStoryConfig } from "@/lib/game-data";

export const runtime = "nodejs";

export async function GET() {
  const config = loadStoryConfig();
  const clientConfig = {
    title: config.title,
    subtitle: config.subtitle,
    loadingText: config.loadingText,
    emptyChatTitle: config.emptyChatTitle,
    emptyChatSubtitle: config.emptyChatSubtitle,
    characterEmoji: config.characterEmoji,
    affectionStages: config.affectionStages.map((s) => ({
      max: s.max,
      label: s.label,
    })),
    initialState: {
      hp: config.initialState.hp,
      maxHp: config.initialState.maxHp,
      mp: config.initialState.mp,
      maxMp: config.initialState.maxMp,
      gold: config.initialState.gold,
      location: config.initialState.location,
      chapter: config.initialState.chapter,
      day: config.initialState.day,
      time: config.initialState.time,
    },
  };
  return Response.json(clientConfig);
}
