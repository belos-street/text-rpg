import { NextRequest } from "next/server";
import { listSaves, createInitialSave } from "@/lib/storage";
import { createSaveRequestSchema } from "@/lib/schema";

export async function GET() {
  try {
    const saves = listSaves();
    return Response.json({ saves });
  } catch {
    return Response.json({ error: "获取存档列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = createSaveRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json(
        { error: "玩家名称需为 1-20 个字符" },
        { status: 400 },
      );
    }
    const save = createInitialSave(parsed.data.playerName);
    return Response.json({ save });
  } catch {
    return Response.json({ error: "创建存档失败" }, { status: 500 });
  }
}
