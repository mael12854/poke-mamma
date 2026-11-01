import { NextResponse } from "next/server";
import { getState, ping, rpc } from "@/lib/db";
import { bad, fail } from "@/lib/api";
import { COOKS } from "@/lib/menu";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = await getState();
    return NextResponse.json({
      activeCook: s.settings.active_cook,
      orders: s.orders.filter((o) => o.status !== "served"),
    });
  } catch (e) {
    return fail(e);
  }
}

/** Actions cuisine : changer de cuisinier, faire avancer une commande. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (body?.action === "cook") {
      if (!COOKS.includes(body.cook)) return bad("Cuisinier inconnu.");
      await rpc("pm_set_cook", { p_cook: body.cook });
    } else if (body?.action === "advance") {
      const id = Number(body.id);
      if (!Number.isInteger(id)) return bad("Commande inconnue.");
      const cook = COOKS.includes(body.cook) ? body.cook : "Maël";
      await rpc("pm_order_advance", { p_id: id, p_cook: cook });
    } else {
      return bad("Action inconnue.");
    }
    await ping();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
