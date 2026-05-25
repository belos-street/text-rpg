import { NextRequest } from "next/server";
import { listSaves, createInitialSave } from "@/lib/storage";

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
    const { playerName } = await req.json();
    if (!playerName) {
      return Response.json({ error: "需要提供玩家名称" }, { status: 400 });
    }
    const save = createInitialSave(playerName);
    return Response.json({ save });
  } catch {
    return Response.json({ error: "创建存档失败" }, { status: 500 });
  }
}
