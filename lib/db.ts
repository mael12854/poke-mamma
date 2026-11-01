import "server-only";
import type { FullState, PublicOpening } from "./types";
import { todayParis } from "./dates";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TOKEN = process.env.PM_API_TOKEN;

export const CHANNEL = "poke-mamma";

export class DbError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export function dbConfigured() {
  return Boolean(URL && KEY && TOKEN);
}

/** Appelle une fonction Postgres (toutes vérifient le jeton serveur). */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!dbConfigured()) throw new DbError("Base de données non configurée", 503);
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_token: TOKEN, ...args }),
    cache: "no-store",
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new DbError(body?.message ?? `Erreur ${res.status}`, res.status >= 500 ? 500 : 400);
  return body as T;
}

/** Prévient les écrans ouverts (borne, cuisine, gérant) qu’il y a du nouveau. */
export async function ping() {
  if (!dbConfigured()) return;
  try {
    await fetch(`${URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic: CHANNEL, event: "change", payload: { at: Date.now() } }] }),
      cache: "no-store",
    });
  } catch {
    // Pas grave : les écrans se rafraîchissent aussi tout seuls.
  }
}

export function getState() {
  return rpc<FullState>("pm_state");
}

export function upcoming(state: FullState): PublicOpening[] {
  const today = todayParis();
  return state.openings
    .filter((o) => o.day >= today)
    .map((o) => ({ id: o.id, day: o.day, time: o.time, left: Math.max(0, o.seats - o.booked) }));
}

export async function getPublicOpenings(): Promise<PublicOpening[]> {
  if (!dbConfigured()) return [];
  try {
    return upcoming(await getState());
  } catch {
    return [];
  }
}
