import { NextResponse } from "next/server";
import { getState, ping, rpc } from "@/lib/db";
import { bad, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Le site envoie une demande pour venir. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";
    const people = Number(body?.people);
    const openingId = Number(body?.openingId);
    if (!name) return bad("Il manque ton prénom.");
    if (!Number.isInteger(openingId)) return bad("Choisis une ouverture.");
    if (!Number.isInteger(people) || people < 1 || people > 30) return bad("Nombre de personnes invalide.");
    const id = await rpc<number>("pm_request_create", { p_opening: openingId, p_name: name, p_people: people });
    await ping();
    return NextResponse.json({ id });
  } catch (e) {
    return fail(e);
  }
}

/** Le site peut redemander où en sont ses propres demandes (ids gardés sur l’appareil). */
export async function GET(req: Request) {
  try {
    const ids = (new URL(req.url).searchParams.get("ids") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, 20);
    if (!ids.length) return NextResponse.json({ requests: [] });
    const state = await getState();
    const requests = state.requests
      .filter((r) => ids.includes(r.id))
      .map((r) => {
        const o = state.openings.find((x) => x.id === r.opening_id);
        return { id: r.id, name: r.name, people: r.people, status: r.status, note: r.note, opening: o ? { day: o.day, time: o.time } : null };
      });
    return NextResponse.json({ requests });
  } catch (e) {
    return fail(e);
  }
}
