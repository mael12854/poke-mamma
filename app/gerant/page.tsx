import type { Metadata } from "next";
import { Gerant } from "@/components/Gerant";
import { GerantLogin } from "@/components/GerantLogin";
import { isGerant } from "@/lib/auth";

export const metadata: Metadata = { title: "Gérant · Poké Mamma" };
export const dynamic = "force-dynamic";

export default async function Page() {
  return (await isGerant()) ? <Gerant /> : <GerantLogin />;
}
