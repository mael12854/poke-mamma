"use client";
import { FormEvent, useEffect, useState } from "react";
import { openingChoice } from "@/lib/dates";
import { post } from "@/lib/live";
import type { PublicOpening, RequestStatus } from "@/lib/types";

const KEY = "pm_mes_demandes";

interface Mine {
  id: number;
  name: string;
  people: number;
  status: RequestStatus;
  note: string | null;
  opening: { day: string; time: string } | null;
}

function readIds(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

export function ReserveForm({ openings, onSent }: { openings: PublicOpening[]; onSent: () => void }) {
  const [name, setName] = useState("");
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [people, setPeople] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [mine, setMine] = useState<Mine[]>([]);

  async function loadMine() {
    const ids = readIds();
    if (!ids.length) return;
    try {
      const res = await fetch(`/api/reservations?ids=${ids.join(",")}`, { cache: "no-store" });
      if (res.ok) setMine((await res.json()).requests);
    } catch {}
  }

  useEffect(() => {
    loadMine();
  }, []);

  useEffect(() => {
    if (openingId == null) {
      const first = openings.find((o) => o.left > 0);
      if (first) setOpeningId(first.id);
    }
  }, [openings, openingId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Il manque ton prénom.");
    if (openingId == null) return setError("Choisis une ouverture.");
    setError(null);
    setSending(true);
    try {
      const { id } = await post<{ id: number }>("/api/reservations", { name: name.trim(), openingId, people });
      try {
        localStorage.setItem(KEY, JSON.stringify([id, ...readIds()].slice(0, 20)));
      } catch {}
      setSent(true);
      onSent();
      loadMine();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oups, ça n’a pas marché.");
    } finally {
      setSending(false);
    }
  }

  const statusLabel: Record<RequestStatus, string> = { pending: "En attente", accepted: "C’est bon !", refused: "Pas cette fois" };

  return (
    <div className="s-form">
      {sent ? (
        <div className="s-sent">
          <span className="bagel">Demande envoyée !</span>
          <span className="hand">On te dit vite si c’est bon.</span>
          <button
            type="button"
            className="s-link"
            onClick={() => {
              setSent(false);
              setName("");
              setPeople(2);
            }}
          >
            Faire une autre demande
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <label className="s-field">
            <span>Ton prénom</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mamie Jo" maxLength={60} autoComplete="given-name" />
          </label>
          <div className="s-field">
            <span>Quelle ouverture ?</span>
            {openings.length === 0 ? (
              <span className="s-empty hand">Pas d’ouverture prévue pour l’instant.</span>
            ) : (
              <div className="s-pills" role="radiogroup" aria-label="Quelle ouverture ?">
                {openings.map((o) => {
                  const full = o.left <= 0;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={openingId === o.id}
                      disabled={full}
                      className={`s-pill${openingId === o.id ? " on" : ""}`}
                      onClick={() => setOpeningId(o.id)}
                    >
                      {openingChoice(o)}
                      {full && " · complet"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="s-count">
            <span>Combien vous êtes ?</span>
            <div className="s-stepper">
              <button type="button" aria-label="Moins" onClick={() => setPeople((p) => Math.max(1, p - 1))}>−</button>
              <span className="bagel" aria-live="polite">{people}</span>
              <button type="button" aria-label="Plus" className="plus" onClick={() => setPeople((p) => Math.min(12, p + 1))}>+</button>
            </div>
          </div>
          {error && <span className="s-error" role="alert">{error}</span>}
          <button type="submit" className="s-submit bagel" disabled={sending}>
            {sending ? "J’envoie…" : "Je réserve"}
          </button>
        </form>
      )}
      {mine.length > 0 && (
        <div className="s-mine">
          <span className="eyebrow">Tes demandes</span>
          {mine.map((m) => (
            <div key={m.id} className="s-mine-row">
              <span>
                <strong>{m.name}</strong> · {m.opening ? openingChoice(m.opening) : "ouverture annulée"} · {m.people}
              </span>
              <span className={`s-status ${m.status}`}>{statusLabel[m.status]}</span>
              {m.note && <span className="hand s-note">« {m.note} »</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
