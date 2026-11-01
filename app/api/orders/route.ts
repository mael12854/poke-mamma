import { NextResponse } from "next/server";
import { ping, rpc } from "@/lib/db";
import { bad, fail } from "@/lib/api";
import { sanitizeBowl } from "@/lib/menu";

export const dynamic = "force-dynamic";

/** La borne envoie un bol en cuisine. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
    const kiosk = Number(body?.kiosk) === 2 ? 2 : 1;
    const bowl = sanitizeBowl(body?.bowl);
    if (!name) return bad("Il manque ton prénom.");
    if (!bowl) return bad("Le bol est incomplet.");
    const res = await rpc<{ num: number; cook: string }>("pm_order_create", { p_kiosk: kiosk, p_order: { ...bowl, name } });
    await ping();
    return NextResponse.json(res);
  } catch (e) {
    return fail(e);
  }
}
