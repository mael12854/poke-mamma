import { CSSProperties } from "react";

/** Le bol Poké Ma-Ma en CSS : cercle, moitié basse remplie, deux baguettes. */
export function Bowl({
  size,
  border = 3,
  fill = "#F26B4F",
  inverted = false,
  stick,
  style,
}: {
  size: number;
  border?: number;
  fill?: string;
  inverted?: boolean;
  stick?: number;
  style?: CSSProperties;
}) {
  const ink = inverted ? "#FBF4E6" : "#1F3A2E";
  const bg = inverted ? "#1F3A2E" : "#FBF4E6";
  const sw = stick ?? Math.max(3, Math.round(size * 0.077));
  const sh = Math.round(size * 0.73);
  const top = Math.max(2, Math.round(size * 0.03));
  return (
    <div
      aria-hidden
      style={{ position: "relative", width: size, height: size, borderRadius: "50%", border: `${border}px solid ${ink}`, background: bg, overflow: "hidden", flex: "none", ...style }}
    >
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "52%", background: fill, borderTop: `${border}px solid ${ink}` }} />
      <div style={{ position: "absolute", width: sw, height: sh, background: ink, borderRadius: sw / 2, top, left: Math.round(size * 0.54), transform: "rotate(28deg)" }} />
      <div style={{ position: "absolute", width: sw, height: sh, background: ink, borderRadius: sw / 2, top, left: Math.round(size * 0.67), transform: "rotate(14deg)" }} />
    </div>
  );
}
