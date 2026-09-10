import { getGlobalProgress, unlockEnding } from "@/lib/global-progress";
import { z } from "zod";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(getGlobalProgress());
}

const unlockSchema = z.object({ ending: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = unlockSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "需要提供 ending ID" }, { status: 400 });
  }
  return Response.json(unlockEnding(parsed.data.ending));
}
