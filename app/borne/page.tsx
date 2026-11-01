import type { Metadata, Viewport } from "next";
import { Borne } from "@/components/Borne";

export const metadata: Metadata = { title: "Borne · Poké Ma-Ma" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "#1F3A2E" };

const BGS: Record<string, [string, string]> = {
  saumon: ["#F26B4F", "#1F3A2E"],
  mangue: ["#F7B530", "#1F3A2E"],
  avocat: ["#8DB255", "#1F3A2E"],
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const kiosk = sp.id === "2" ? 2 : 1;
  const bg = BGS[String(sp.bg ?? "").toLowerCase()] ?? BGS.saumon;
  return <Borne kiosk={kiosk} welcomeBg={bg[0]} welcomeInk={bg[1]} />;
}
