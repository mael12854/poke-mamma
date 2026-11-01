import "server-only";
import { NextResponse } from "next/server";
import { DbError } from "./db";

const MESSAGES: Record<string, string> = {
  not_enough_seats: "Plus assez de places pour cette ouverture.",
  seats_below_booked: "Impossible : des invités sont déjà acceptés.",
  opening_not_found: "Cette ouverture n’existe plus.",
  request_not_found: "Cette demande n’existe plus.",
};

export function fail(e: unknown) {
  const msg = e instanceof Error ? e.message : "Erreur";
  const status = e instanceof DbError ? e.status : 500;
  return NextResponse.json({ error: MESSAGES[msg] ?? msg }, { status });
}

export function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
