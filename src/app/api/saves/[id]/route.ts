import { NextRequest } from "next/server";
import { getSave, deleteSave, getConversation } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const save = getSave(id);
  if (!save) {
    return Response.json({ error: "存档不存在" }, { status: 404 });
  }
  const history = getConversation(id);
  return Response.json({ save, history });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const success = deleteSave(id);
  if (!success) {
    return Response.json({ error: "删除失败" }, { status: 404 });
  }
  return Response.json({ success: true });
}
