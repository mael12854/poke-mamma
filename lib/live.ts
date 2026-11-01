"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;
function supabase() {
  if (client === undefined) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  }
  return client;
}

/**
 * Données en direct : on recharge dès qu’un écran signale un changement
 * (Supabase Realtime), et toutes les `every` ms au cas où.
 */
export function useLive<T>(url: string | null, every = 4000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const busy = useRef(false);

  const reload = useCallback(async () => {
    if (!url || busy.current) return;
    busy.current = true;
    try {
      const res = await fetch(url, { cache: "no-store" });
      setStatus(res.status);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Erreur");
      setData(body as T);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      busy.current = false;
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;
    reload();
    const iv = setInterval(reload, every);
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    const sb = supabase();
    const ch = sb?.channel("poke-mamma").on("broadcast", { event: "change" }, () => reload()).subscribe();
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      if (ch && sb) sb.removeChannel(ch);
    };
  }, [url, every, reload]);

  return { data, setData, error, status, reload };
}

export async function post<T = { ok: true }>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Oups, ça n’a pas marché.");
  return data as T;
}

/** Met un écran dessiné pour `w`×`h` à l’échelle de la fenêtre (plein écran). */
export function useFit(w: number, h: number) {
  const [box, setBox] = useState<{ zoom: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const zoom = Math.min(vw / w, vh / h);
      setBox({ zoom, width: vw / zoom, height: vh / zoom });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [w, h]);
  return box;
}

export function useNow(every = 20000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(iv);
  }, [every]);
  return now;
}
