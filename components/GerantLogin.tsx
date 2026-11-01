"use client";
import { FormEvent, useState } from "react";
import { Bowl } from "./Bowl";
import { post } from "@/lib/live";
import "./gerant.css";

export function GerantLogin() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await post("/api/gerant", { action: "login", code });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mauvais code.");
      setBusy(false);
    }
  }

  return (
    <div className="g-login">
      <form onSubmit={submit} className="g-login-card">
        <div className="g-login-brand">
          <Bowl size={56} />
          <span className="g-brand-txt">
            <span className="bagel">Poké Mamma</span>
            <span className="hand">côté gérant</span>
          </span>
        </div>
        <label className="g-field">
          <span>Le code secret</span>
          <input type="password" inputMode="text" autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="••••" autoComplete="current-password" />
        </label>
        {error && <span className="g-error">{error}</span>}
        <button className="g-btn-primary bagel" disabled={busy}>{busy ? "J’entre…" : "Entrer"}</button>
      </form>
    </div>
  );
}
