"use client";
import { useEffect, useMemo, useState } from "react";
import { Bowl } from "./Bowl";
import { agoLong, hhmm, moment, shortDate, todayParis, weekday } from "@/lib/dates";
import { post, useLive, useNow } from "@/lib/live";
import type { FullState, Opening, Reservation, RequestStatus } from "@/lib/types";
import "./gerant.css";

type Tab = "req" | "open" | "orders";

const HEAD: Record<Tab, [string, string]> = {
  req: ["Qui veut venir ?", "Demandes pour venir"],
  open: ["Planning", "Ouvertures"],
  orders: ["Aujourd’hui", "Commandes"],
};

const ORDER_ST = {
  new: ["À préparer", "#F7B530"],
  cooking: ["En cuisine", "#F26B4F"],
  ready: ["Prêt", "#8DB255"],
  served: ["Servi", "#FBF4E6"],
} as const;

const openingLong = (o: Opening) => `${weekday(o.day)} ${shortDate(o.day)} · ${moment(o.time)} · ${hhmm(o.time)}`;
const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? "s" : ""}`;

function nextSaturday() {
  const t = new Date(`${todayParis()}T12:00:00Z`);
  const add = ((6 - t.getUTCDay() + 7) % 7) || 7;
  t.setUTCDate(t.getUTCDate() + add);
  return t.toISOString().slice(0, 10);
}

export function Gerant() {
  const [tab, setTab] = useState<Tab>("req");
  const [filter, setFilter] = useState<RequestStatus>("pending");
  const [toast, setToast] = useState<string | null>(null);
  const now = useNow(30000);
  const { data, error, status, reload, setData } = useLive<FullState>("/api/gerant", 5000);

  useEffect(() => {
    if (status === 401) window.location.reload();
  }, [status]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function act(body: Record<string, unknown>) {
    try {
      await post("/api/gerant", body);
      return true;
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Oups, ça n’a pas marché.");
      return false;
    } finally {
      reload();
    }
  }

  const requests = data?.requests ?? [];
  const openings = data?.openings ?? [];
  const pending = requests.filter((r) => r.status === "pending").length;
  const today = todayParis(new Date(now));
  const nextId = openings.find((o) => o.day >= today)?.id;

  async function logout() {
    await post("/api/gerant", { action: "logout" }).catch(() => {});
    window.location.reload();
  }

  return (
    <div className="g-app">
      <aside className="g-side">
        <div className="g-side-brand">
          <Bowl size={44} inverted />
          <span className="g-brand-txt">
            <span className="bagel">Poké Mamma</span>
            <span className="hand">côté gérant</span>
          </span>
        </div>
        <nav className="g-tabs">
          {(["req", "open", "orders"] as Tab[]).map((k) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} aria-current={tab === k}>
              <span>{k === "req" ? "Demandes" : k === "open" ? "Ouvertures" : "Commandes"}</span>
              {k === "req" && pending > 0 && <span className="g-badge">{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="g-who">
          <span className="eyebrow">Connecté</span>
          <span className="bagel">Renaud</span>
          <button onClick={logout}>Se déconnecter</button>
        </div>
      </aside>

      <main className="g-main">
        <header className="g-head">
          <div className="g-head-txt">
            <span className="eyebrow">{HEAD[tab][0]}</span>
            <h1 className="bagel">
              {HEAD[tab][1]}
              {tab === "req" && pending > 0 && <span className="g-head-count">{pending} en attente</span>}
            </h1>
          </div>
          {tab === "req" && (
            <div className="g-filters">
              {(
                [
                  ["pending", "En attente"],
                  ["accepted", "Acceptées"],
                  ["refused", "Refusées"],
                ] as [RequestStatus, string][]
              ).map(([k, label]) => (
                <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
                  {label} · {requests.filter((r) => r.status === k).length}
                </button>
              ))}
            </div>
          )}
          {tab === "open" && (
            <button className="g-btn-saumon bagel" onClick={() => window.dispatchEvent(new Event("pm-new-opening"))}>
              + Nouvelle ouverture
            </button>
          )}
          {tab === "orders" && (
            <button
              className="g-btn-white"
              onClick={() => {
                if (confirm("Remettre les numéros à 1 ? La prochaine commande sera la n° 1.")) {
                  setData((d) => (d ? { ...d, settings: { ...d.settings, next_num: 1 } } : d));
                  act({ action: "resetCounter" });
                }
              }}
            >
              Remettre les numéros à 1
            </button>
          )}
        </header>

        <div className="g-body">
          {error && !data && <div className="g-banner">Impossible de charger : {error}</div>}
          {!data && !error && <span className="g-loading hand">Je regarde…</span>}
          {data && tab === "req" && (
            <Requests list={requests.filter((r) => r.status === filter)} openings={openings} now={now} act={act} />
          )}
          {data && tab === "open" && <Openings openings={openings} requests={requests} nextId={nextId} today={today} act={act} />}
          {data && tab === "orders" && (
            <>
              <div className="g-table">
                <div className="g-row g-row-head">
                  <span>N°</span><span>Prénom</span><span>Bol</span><span>Cuisinier</span><span>Statut</span>
                </div>
                {data.orders.length === 0 && <div className="g-row-empty hand">Pas encore de commande aujourd’hui.</div>}
                {data.orders.map((o) => (
                  <div key={o.id} className="g-row">
                    <span className="bagel g-row-num">{o.num}</span>
                    <span className="g-row-name">{o.name}</span>
                    <span className="g-row-bowl">
                      {o.base ?? "—"} · {o.proteine ? `${o.proteine} × ${o.qty}` : "—"} · {plural(o.legumes.length, "légume")}
                      {o.extras.length > 0 && ` · + ${o.extras.join(", ")}`}
                    </span>
                    <span className="g-row-cook">{o.cook ?? "—"}</span>
                    <span className="g-pill" style={{ background: ORDER_ST[o.status][1] }}>{ORDER_ST[o.status][0]}</span>
                  </div>
                ))}
              </div>
              <span className="g-next">Prochain numéro sur la borne : <strong>{data.settings.next_num}</strong></span>
            </>
          )}
        </div>
      </main>

      {toast && <div className="g-toast" role="alert">{toast}</div>}
    </div>
  );

}

type Act = (body: Record<string, unknown>) => Promise<boolean>;

function Requests({ list, openings, now, act }: { list: Reservation[]; openings: Opening[]; now: number; act: Act }) {
  if (!list.length) return <span className="g-empty hand">Aucune demande ici.</span>;
  return (
    <>
      {list.map((r) => (
        <RequestCard key={r.id} r={r} o={openings.find((x) => x.id === r.opening_id)} now={now} act={act} />
      ))}
    </>
  );
}

function RequestCard({ r, o, now, act }: { r: Reservation; o?: Opening; now: number; act: Act }) {
  const [deciding, setDeciding] = useState<"accepted" | "refused" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const left = o ? o.seats - o.booked : 0;
  const fits = Boolean(o) && left >= r.people;

  async function decide(status: RequestStatus, n?: string) {
    setBusy(true);
    const ok = await act({ action: "decide", id: r.id, status, note: n ?? null });
    setBusy(false);
    if (ok) {
      setDeciding(null);
      setNote("");
    }
  }

  return (
    <div className="g-card g-req">
      <div className="g-req-info">
        <div className="g-req-top">
          <span className="bagel g-req-name">{r.name}</span>
          <span className="g-req-ago">demande {agoLong(r.created_at, now)}</span>
        </div>
        <div className="g-chips">
          <span className="g-chip">{o ? openingLong(o) : "Ouverture supprimée"}</span>
          <span className="g-chip">{plural(r.people, "personne")}</span>
          {o && <span className="g-chip dashed">{Math.max(0, left)} place{left > 1 ? "s" : ""} libre{left > 1 ? "s" : ""}</span>}
        </div>
        {r.note && r.status !== "pending" && <span className="hand g-msg">« {r.note} »</span>}
        {deciding && (
          <div className="g-decide">
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder={deciding === "accepted" ? "Un petit mot ? (facultatif) — ex : On t’attend !" : "Un petit mot ? (facultatif) — ex : La prochaine fois !"}
              onKeyDown={(e) => e.key === "Enter" && decide(deciding, note)}
            />
          </div>
        )}
      </div>
      {r.status === "pending" && !deciding && (
        <div className="g-actions">
          <button className="g-btn-riz" onClick={() => setDeciding("refused")}>Refuser</button>
          <button
            className="g-btn-accept bagel"
            style={{ opacity: fits ? 1 : 0.4 }}
            aria-disabled={!fits}
            title={fits ? undefined : "Plus assez de places"}
            onClick={() => fits && setDeciding("accepted")}
          >
            {fits ? "Accepter" : "Complet"}
          </button>
        </div>
      )}
      {r.status === "pending" && deciding && (
        <div className="g-actions">
          <button className="g-link" onClick={() => setDeciding(null)}>Annuler</button>
          <button
            className={deciding === "accepted" ? "g-btn-accept bagel" : "g-btn-refuse bagel"}
            disabled={busy}
            onClick={() => decide(deciding, note)}
          >
            {deciding === "accepted" ? "Oui, accepter" : "Oui, refuser"}
          </button>
        </div>
      )}
      {r.status !== "pending" && (
        <div className="g-actions">
          <span className="g-status bagel" style={{ background: r.status === "accepted" ? "#8DB255" : "#FBF4E6" }}>
            {r.status === "accepted" ? "Acceptée" : "Refusée"}
          </span>
          <button className="g-link" disabled={busy} onClick={() => decide("pending")}>Annuler</button>
        </div>
      )}
    </div>
  );
}

function Openings({ openings, requests, nextId, today, act }: { openings: Opening[]; requests: Reservation[]; nextId?: number; today: string; act: Act }) {
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const open = () => setCreating(true);
    window.addEventListener("pm-new-opening", open);
    return () => window.removeEventListener("pm-new-opening", open);
  }, []);

  const sorted = useMemo(() => {
    const up = openings.filter((o) => o.day >= today);
    const past = openings.filter((o) => o.day < today).reverse();
    return [...up, ...past];
  }, [openings, today]);

  return (
    <>
      {creating && (
        <OpeningForm
          initial={{ day: nextSaturday(), time: "12:30", seats: 6 }}
          title="Nouvelle ouverture"
          submitLabel="Créer"
          onCancel={() => setCreating(false)}
          onSave={async (v) => {
            if (await act({ action: "saveOpening", id: null, ...v })) setCreating(false);
          }}
        />
      )}
      {sorted.length === 0 && !creating && <span className="g-empty hand">Pas encore d’ouverture. Clique sur « + Nouvelle ouverture ».</span>}
      <div className="g-open-grid">
        {sorted.map((o) => (
          <OpeningCard
            key={o.id}
            o={o}
            isNext={o.id === nextId}
            past={o.day < today}
            guests={requests.filter((r) => r.opening_id === o.id && r.status === "accepted")}
            act={act}
          />
        ))}
      </div>
    </>
  );
}

function OpeningForm({
  initial,
  title,
  submitLabel,
  onSave,
  onCancel,
  minSeats = 0,
}: {
  initial: { day: string; time: string; seats: number };
  title: string;
  submitLabel: string;
  onSave: (v: { day: string; time: string; seats: number }) => void;
  onCancel: () => void;
  minSeats?: number;
}) {
  const [v, setV] = useState(initial);
  return (
    <div className="g-card g-open-form">
      <span className="bagel g-open-day">{title}</span>
      <div className="g-form-row">
        <label className="g-field">
          <span>Date</span>
          <input type="date" value={v.day} onChange={(e) => setV({ ...v, day: e.target.value })} />
        </label>
        <label className="g-field">
          <span>Heure</span>
          <input type="time" value={v.time} step={300} onChange={(e) => setV({ ...v, time: e.target.value })} />
        </label>
        <div className="g-field">
          <span>Places</span>
          <Stepper value={v.seats} onMinus={() => setV({ ...v, seats: Math.max(minSeats, v.seats - 1) })} onPlus={() => setV({ ...v, seats: Math.min(99, v.seats + 1) })} />
        </div>
      </div>
      <div className="g-form-actions">
        <button className="g-link" onClick={onCancel}>Annuler</button>
        <button className="g-btn-saumon bagel" disabled={!v.day || !v.time} onClick={() => onSave(v)}>{submitLabel}</button>
      </div>
    </div>
  );
}

function Stepper({ value, onMinus, onPlus }: { value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="g-stepper">
      <button type="button" aria-label="Moins" onClick={onMinus}>−</button>
      <span className="bagel">{value}</span>
      <button type="button" aria-label="Plus" className="plus" onClick={onPlus}>+</button>
    </div>
  );
}

function OpeningCard({ o, isNext, past, guests, act }: { o: Opening; isNext: boolean; past: boolean; guests: Reservation[]; act: Act }) {
  const [editing, setEditing] = useState(false);
  const left = o.seats - o.booked;

  if (editing) {
    return (
      <OpeningForm
        initial={{ day: o.day, time: o.time, seats: o.seats }}
        title={`Modifier ${weekday(o.day)}`}
        submitLabel="Enregistrer"
        minSeats={o.booked}
        onCancel={() => setEditing(false)}
        onSave={async (v) => {
          if (await act({ action: "saveOpening", id: o.id, ...v })) setEditing(false);
        }}
      />
    );
  }

  const setSeats = (seats: number) => act({ action: "saveOpening", id: o.id, day: o.day, time: o.time, seats });

  return (
    <div className={`g-card g-open${past ? " past" : ""}`}>
      <div className="g-open-top">
        <div className="g-open-when">
          <span className="bagel g-open-day">{weekday(o.day)} <span className="g-open-date">{shortDate(o.day)}</span></span>
          <span className="g-open-time">{moment(o.time)} · {hhmm(o.time)}</span>
        </div>
        {isNext && <span className="g-tag">Sur le site</span>}
        {past && <span className="g-tag riz">Passée</span>}
      </div>
      <div className="g-seats">
        <span className="g-seats-label">Places</span>
        <Stepper value={o.seats} onMinus={() => o.seats > o.booked && setSeats(o.seats - 1)} onPlus={() => setSeats(o.seats + 1)} />
        <span className="hand g-left">{left <= 0 ? "Complet" : `${left} libre${left > 1 ? "s" : ""}`}</span>
      </div>
      <div className="g-guests">
        <span className="eyebrow">Invités</span>
        <span>{guests.length ? guests.map((g) => `${g.name} (${g.people})`).join(" · ") : "Personne pour l’instant"}</span>
      </div>
      <div className="g-open-links">
        <button className="g-link" onClick={() => setEditing(true)}>Modifier</button>
        <button
          className="g-link"
          onClick={() => {
            const warn = guests.length ? `\n${plural(guests.length, "invité")} déjà accepté${guests.length > 1 ? "s" : ""}.` : "";
            if (confirm(`Supprimer l’ouverture du ${weekday(o.day).toLowerCase()} ${shortDate(o.day)} ?${warn}`)) act({ action: "deleteOpening", id: o.id });
          }}
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
