import type { Metadata, Viewport } from "next";
import { Cuisine } from "@/components/Cuisine";

export const metadata: Metadata = { title: "Cuisine · Poké Ma-Ma" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "#1F3A2E" };

export default function Page() {
  return <Cuisine />;
}
