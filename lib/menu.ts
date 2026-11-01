export const NORI = "#1F3A2E";
export const RIZ = "#FBF4E6";
export const SAUMON = "#F26B4F";
export const SAUMON_FONCE = "#C2452A";
export const AVOCAT = "#8DB255";
export const MANGUE = "#F7B530";
export const BLANC = "#FFFFFF";

export type StepKey = "base" | "legumes" | "proteine" | "tips" | "extras";

export interface Step {
  key: StepKey;
  n: number;
  title: string;
  hint: string;
  multi: boolean;
  required: boolean;
  color: string;
  items: [string, string][];
}

export const STEPS: Step[] = [
  { key: "base", n: 1, title: "Base riz", hint: "Choisis une taille", multi: false, required: true, color: RIZ,
    items: [["Petite", RIZ], ["Moyenne", RIZ], ["Grande", RIZ]] },
  { key: "legumes", n: 2, title: "Légumes", hint: "Prends-en autant que tu veux", multi: true, required: false, color: AVOCAT,
    items: [["Avocat", AVOCAT], ["Edamame", AVOCAT], ["Mangue", MANGUE], ["Concombre", AVOCAT], ["Petits pois", AVOCAT], ["Coriandre", AVOCAT]] },
  { key: "proteine", n: 3, title: "Protéines", hint: "Cru ou cuit ?", multi: false, required: true, color: SAUMON,
    items: [["Saumon cru", SAUMON], ["Saumon cuit", SAUMON_FONCE]] },
  { key: "tips", n: 4, title: "Tips", hint: "Pour finir le bol", multi: true, required: false, color: MANGUE,
    items: [["Soja sucré", NORI], ["Soja salé", NORI], ["Fromage frais", BLANC], ["Wasabi", AVOCAT], ["Graines de sésame", RIZ], ["Algues", NORI]] },
  { key: "extras", n: 5, title: "En plus", hint: "Un dessert ? De l’eau ?", multi: true, required: false, color: BLANC,
    items: [["Fromage blanc + sucre", BLANC], ["Carafe d’eau", RIZ]] },
];

export const COOKS = ["Maël", "Marin", "Renaud"] as const;

export interface Bowl {
  base: string | null;
  legumes: string[];
  proteine: string | null;
  qty: number;
  tips: string[];
  extras: string[];
}

export function fmtBowl(o: Bowl) {
  return {
    base: o.base || "—",
    legumes: o.legumes.length ? o.legumes.join(", ") : "Aucun",
    proteine: o.proteine ? `${o.proteine} × ${o.qty}` : "—",
    tips: o.tips.length ? o.tips.join(", ") : "Aucun",
    extras: o.extras.length ? o.extras.join(", ") : "Rien",
  };
}

/** Garde seulement les options qui existent vraiment sur la carte. */
export function sanitizeBowl(input: unknown): Bowl | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const opts = (k: StepKey) => STEPS.find((s) => s.key === k)!.items.map(([l]) => l);
  const one = (k: StepKey) => (typeof o[k] === "string" && opts(k).includes(o[k] as string) ? (o[k] as string) : null);
  const many = (k: StepKey) =>
    Array.isArray(o[k]) ? opts(k).filter((l) => (o[k] as unknown[]).includes(l)) : [];
  const qty = Number(o.qty);
  const bowl: Bowl = {
    base: one("base"),
    legumes: many("legumes"),
    proteine: one("proteine"),
    qty: Number.isInteger(qty) && qty >= 1 && qty <= 9 ? qty : 2,
    tips: many("tips"),
    extras: many("extras"),
  };
  if (!bowl.base || !bowl.proteine) return null;
  return bowl;
}
