import { NextResponse } from "next/server";
import { getState, upcoming } from "@/lib/db";
import { fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ openings: upcoming(await getState()) });
  } catch (e) {
    return fail(e);
  }
}
