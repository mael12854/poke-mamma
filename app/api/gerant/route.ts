import { NextResponse } from "next/server";
import { getState, ping, rpc } from "@/lib/db";
import { bad, fail } from "@/lib/api";
import { COOKIE, checkCode, isGerant, sessionValue } from "@/lib/auth";
import { todayParis } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isGerant())) return bad("Code requis.", 401);
  try {
    const s = await getState();
    const today = todayParis();
    const paris = (iso: string) => todayParis(new Date(iso));
    return NextResponse.json({
      settings: s.settings,
      openings: s.openings,
      requests: s.requests,
      orders: s.orders.filter((o) => paris(o.created_at) === today),
    });
  } catch (e) {
    return fail(e);
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^[0-2]\d:[0-5]\d$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "login") {
    if (!process.env.GERANT_CODE) return bad("GERANT_CODE n’est pas configuré.", 503);
    if (typeof body.code !== "string" || !checkCode(body.code)) return bad("Mauvais code.", 401);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, sessionValue()!, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 60 });
    return res;
  }
  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(COOKIE);
    return res;
  }

  if (!(await isGerant())) return bad("Code requis.", 401);
  try {
    switch (action) {
      case "decide": {
        const id = Number(body.id);
        if (!Number.isInteger(id) || !["pending", "accepted", "refused"].includes(body.status)) return bad("Demande invalide.");
        const note = typeof body.note === "string" ? body.note.slice(0, 200) : null;
        await rpc("pm_request_decide", { p_id: id, p_status: body.status, p_note: note });
        break;
      }
      case "saveOpening": {
        const id = body.id == null ? null : Number(body.id);
        const seats = Number(body.seats);
        if (!DAY.test(body.day ?? "") || !TIME.test(body.time ?? "")) return bad("Date ou heure invalide.");
        if (!Number.isInteger(seats) || seats < 0 || seats > 99) return bad("Nombre de places invalide.");
        await rpc("pm_opening_save", { p_id: id, p_day: body.day, p_time: body.time, p_seats: seats });
        break;
      }
      case "deleteOpening": {
        const id = Number(body.id);
        if (!Number.isInteger(id)) return bad("Ouverture invalide.");
        await rpc("pm_opening_delete", { p_id: id });
        break;
      }
      case "resetCounter":
        await rpc("pm_reset_counter");
        break;
      default:
        return bad("Action inconnue.");
    }
    await ping();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
