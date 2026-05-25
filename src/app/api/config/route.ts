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
  };
  return Response.json(clientConfig);
}
