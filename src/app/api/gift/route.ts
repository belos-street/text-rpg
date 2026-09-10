import { NextRequest } from "next/server";
import { z } from "zod";
import { getSave, updateSave } from "@/lib/storage";
import { getAffectionStage } from "@/lib/affection";

export const runtime = "nodejs";

// C4 背包赠送：道具 -1，目标角色好感 +3（在 B6 硬执法限幅内）
const GIFT_AFFECTION = 3;

const giftSchema = z.object({
  saveId: z.string().min(1),
  itemId: z.string().min(1),
  characterId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = giftSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "参数不合法" }, { status: 400 });
  }
  const { saveId, itemId, characterId } = parsed.data;

  const save = getSave(saveId);
  if (!save) return Response.json({ error: "存档不存在" }, { status: 404 });

  const item = save.inventory.find((i) => i.itemId === itemId);
  if (!item) return Response.json({ error: "背包中没有该道具" }, { status: 404 });

  const relation = save.relations.find((r) => r.characterId === characterId);
  if (!relation) return Response.json({ error: "角色不存在" }, { status: 404 });

  const inventory = save.inventory
    .map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i))
    .filter((i) => i.quantity > 0);
  const affection = Math.max(0, Math.min(100, relation.affection + GIFT_AFFECTION));
  const relations = save.relations.map((r) =>
    r.characterId === characterId
      ? { ...r, affection, stage: getAffectionStage(affection) }
      : r,
  );

  await updateSave(saveId, { inventory, relations });

  return Response.json({
    success: true,
    giftMessage: `将「${item.itemName}」赠给了 ${relation.characterName}`,
    affectionChange: GIFT_AFFECTION,
    inventory,
    relations,
  });
}
