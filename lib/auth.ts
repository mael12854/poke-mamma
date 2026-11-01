import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "pm_gerant";

function expected() {
  const code = process.env.GERANT_CODE;
  if (!code) return null;
  return createHash("sha256").update(`${code}:${process.env.PM_API_TOKEN ?? ""}:poke-mamma`).digest("hex");
}

export function checkCode(code: string) {
  const real = process.env.GERANT_CODE;
  if (!real) return false;
  const a = Buffer.from(code.trim());
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sessionValue() {
  return expected();
}

export async function isGerant() {
  const exp = expected();
  if (!exp) return false;
  const jar = await cookies();
  return jar.get(COOKIE)?.value === exp;
}
