const TZ = "Europe/Paris";

/** Date du jour à Paris, format YYYY-MM-DD. */
export function todayParis(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function asDate(day: string) {
  return new Date(`${day}T12:00:00Z`);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Samedi" */
export function weekday(day: string) {
  return cap(new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "UTC" }).format(asDate(day)));
}

/** "7 nov." */
export function shortDate(day: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(asDate(day));
}

/** "12h30" */
export function hhmm(time: string) {
  const [h, m] = time.split(":");
  return `${Number(h)}h${m}`;
}

/** "Midi", "Goûter"… selon l’heure. */
export function moment(time: string) {
  const h = Number(time.split(":")[0]);
  if (h < 11) return "Matin";
  if (h < 15) return "Midi";
  if (h < 18) return "Goûter";
  return "Soir";
}

/** Label court pour un choix : "Samedi 7 nov. · midi" */
export function openingChoice(o: { day: string; time: string }) {
  return `${weekday(o.day)} ${shortDate(o.day)} · ${moment(o.time).toLowerCase()}`;
}

/** "Samedi · 12h30" (ajoute la date si c’est dans plus de 6 jours). */
export function openingHero(o: { day: string; time: string }, now = new Date()) {
  const diff = (asDate(o.day).getTime() - asDate(todayParis(now)).getTime()) / 86400000;
  const d = diff > 6 ? `${weekday(o.day)} ${shortDate(o.day)}` : weekday(o.day);
  return `${d} · ${hhmm(o.time)}`;
}

export function agoLong(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return "à l’instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export function agoShort(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return m < 1 ? "à l’instant" : `${m} min`;
}

export function clock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}h${m}`;
}

export function places(n: number) {
  return `${n} place${n > 1 ? "s" : ""}`;
}
