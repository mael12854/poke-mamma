import { Site } from "@/components/Site";
import { getPublicOpenings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const openings = await getPublicOpenings();
  return <Site initialOpenings={openings} />;
}
