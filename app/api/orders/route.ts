import { NextResponse } from "next/server";
import { ping, rpc } from "@/lib/db";
import { bad, fail } from "@/lib/api";
import { MAX_BOWLS, sanitizeBowl, type Bowl } from "@/lib/menu";

export const dynamic = "force-dynamic";

/** La borne envoie une commande (un ou plusieurs bols) en cuisine. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
    const kiosk = Number(body?.kiosk) === 2 ? 2 : 1;
    const raw: unknown[] = Array.isArray(body?.bowls) ? body.bowls : body?.bowl ? [body.bowl] : [];
    const bowls = raw.map(sanitizeBowl);
    if (!name) return bad("Il manque ton prénom.");
    if (!bowls.length || bowls.some((b) => !b)) return bad("Un bol est incomplet.");
    if (bowls.length > MAX_BOWLS) return bad(`${MAX_BOWLS} bols maximum par commande.`);
    const res = await rpc<{ num: number; cook: string }>("pm_order_create_multi", {
      p_kiosk: kiosk,
      p_name: name,
      p_bowls: bowls as Bowl[],
    });
    await ping();
    return NextResponse.json(res);
  } catch (e) {
    return fail(e);
  }
}
