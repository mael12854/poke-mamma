"use client";
import { useState } from "react";
import { Bowl } from "./Bowl";
import { COOKS, bowlsLabel, fmtBowl, orderBowls } from "@/lib/menu";
import { agoShort, clock } from "@/lib/dates";
import { post, useFit, useLive, useNow } from "@/lib/live";
import type { Order, OrderStatus } from "@/lib/types";
import "./cuisine.css";

const COLS: { status: OrderStatus; title: string; accent: string; action: string; empty: string }[] = [
  { status: "new", title: "À préparer", accent: "#F7B530", action: "Je prépare", empty: "Pas de commande" },
  { status: "cooking", title: "En cuisine", accent: "#F26B4F", action: "Tenez !", empty: "Rien sur le feu" },
  { status: "ready", title: "Prêt à servir", accent: "#8DB255", action: "Servi", empty: "Tout est servi" },
];

const NEXT: Record<OrderStatus, OrderStatus> = { new: "cooking", cooking: "ready", ready: "served", served: "served" };

export function Cuisine() {
  const box = useFit(1280, 720);
  const now = useNow(20000);
  const { data, setData, error, reload } = useLive<{ activeCook: string; orders: Order[] }>("/api/kitchen", 3000);
  const [busy, setBusy] = useState<number | null>(null);
  const cook = data?.activeCook ?? "Maël";

  async function pickCook(c: string) {
    setData((d) => (d ? { ...d, activeCook: c } : d));
    try {
      await post("/api/kitchen", { action: "cook", cook: c });
    } finally {
      reload();
    }
  }

  async function advance(o: Order) {
    if (busy) return;
    setBusy(o.id);
    setData((d) =>
      d
        ? {
            ...d,
            orders: d.orders
              .map((x) => (x.id === o.id ? { ...x, status: NEXT[x.status], cook: x.status === "new" ? cook : x.cook } : x))
              .filter((x) => x.status !== "served"),
          }
        : d,
    );
    try {
      await post("/api/kitchen", { action: "advance", id: o.id, cook });
    } finally {
      setBusy(null);
      reload();
    }
  }

  if (!box) return <div className="c-outer" />;
  const orders = data?.orders ?? [];

  return (
    <div className="c-outer">
      <div className="c-screen" style={{ zoom: box.zoom, width: box.width, height: box.height }}>
        <header className="c-top">
          <div className="c-brand">
            <Bowl size={44} inverted />
            <span className="bagel">Cuisine</span>
          </div>
          <div className="c-cooks">
            <span>Aux fourneaux :</span>
            {COOKS.map((c) => (
              <button key={c} onClick={() => pickCook(c)} className={c === cook ? "on" : ""} aria-pressed={c === cook}>
                {c}
              </button>
            ))}
          </div>
          <span className="bagel c-clock">{clock(new Date(now))}</span>
        </header>
        {error && !data && <div className="c-error">La cuisine n’arrive pas à joindre le serveur : {error}</div>}
        <div className="c-cols">
          {COLS.map((col) => {
            const items = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="c-col">
                <div className="c-col-head">
                  <span className="bagel" style={{ color: col.accent }}>{col.title}</span>
                  <span className="c-count" style={{ background: col.accent }}>{items.length}</span>
                </div>
                {items.length === 0 && <span className="c-empty hand">{col.empty}</span>}
                {items.map((o) => {
                  const bowls = orderBowls(o);
                  return (
                    <div key={o.id} className="c-ticket" style={{ borderTopColor: col.accent }}>
                      <div className="c-ticket-top">
                        <span className="bagel c-num">n° {o.num}</span>
                        <span className="c-name">{o.name}</span>
                        <span className="c-ago">{agoShort(o.created_at, now)}</span>
                      </div>
                      {bowls.length > 1 && <span className="c-multi">{bowlsLabel(bowls.length)}</span>}
                      {bowls.map((b, i) => {
                        const f = fmtBowl(b);
                        return (
                          <div key={i} className={`c-lines${bowls.length > 1 ? " c-bowl" : ""}`}>
                            {bowls.length > 1 && <span className="c-bowl-n bagel">Bol {i + 1}</span>}
                            <span><strong>Riz</strong> · {f.base}</span>
                            <span><strong>Légumes</strong> · {f.legumes}</span>
                            <span className="c-prot">{f.proteine}</span>
                            <span><strong>Tips</strong> · {f.tips}</span>
                            {b.extras.length > 0 && <span><strong>+</strong> {f.extras}</span>}
                          </div>
                        );
                      })}
                      <div className="c-ticket-foot">
                        <span className="hand">
                          {o.status === "new" ? "En attente" : o.status === "cooking" ? `${o.cook} prépare` : `Prêt · ${o.cook}`}
                        </span>
                        <button className="bagel" style={{ background: col.accent }} disabled={busy === o.id} onClick={() => advance(o)}>
                          {col.action}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
