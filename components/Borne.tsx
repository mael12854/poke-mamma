"use client";
import { useEffect, useRef, useState } from "react";
import { Bowl } from "./Bowl";
import { MANGUE, MAX_BOWLS, NORI, RIZ, STEPS, bowlsLabel, fmtBowl, type Bowl as BowlData, type StepKey } from "@/lib/menu";
import { post, useFit } from "@/lib/live";
import "./borne.css";

interface Draft {
  base: string | null;
  legumes: string[];
  proteine: string | null;
  qty: number;
  tips: string[];
  extras: string[];
  name: string;
}

const empty = (): Draft => ({ base: null, legumes: [], proteine: null, qty: 2, tips: [], extras: [], name: "" });
const bowlOf = ({ name: _n, ...b }: Draft): BowlData => b;
const summary = (b: BowlData) => {
  const f = fmtBowl(b);
  return `${f.base} · ${f.proteine} · ${b.legumes.length ? f.legumes : "sans légumes"}`;
};

const MERCI_IDLE = 20_000;
const CHOICE_IDLE = 180_000;

export function Borne({ kiosk, welcomeBg, welcomeInk }: { kiosk: number; welcomeBg: string; welcomeInk: string }) {
  const box = useFit(720, 1100);
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(empty);
  const [cart, setCart] = useState<BowlData[]>([]);
  const [last, setLast] = useState<{ num: number; name: string; cook: string; count: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touch, setTouch] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setStep(0);
    setD(empty());
    setCart([]);
    setError(null);
  };

  // Retour à l’accueil si personne ne touche l’écran.
  useEffect(() => {
    if (step === 0) return;
    const t = setTimeout(reset, step === 7 ? MERCI_IDLE : CHOICE_IDLE);
    return () => clearTimeout(t);
  }, [step, touch]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const st = step >= 1 && step <= 5 ? STEPS[step - 1] : null;
  const canNext = !st || !st.required || Boolean(d[st.key]);
  const f = fmtBowl(d);

  function toggle(key: StepKey, label: string, multi: boolean) {
    setD((x) => {
      if (!multi) return { ...x, [key]: label };
      const list = x[key] as string[];
      return { ...x, [key]: list.includes(label) ? list.filter((l) => l !== label) : [...list, label] };
    });
  }

  function start() {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    } catch {}
    setStep(1);
  }

  async function send() {
    const name = d.name.trim();
    if (!name || sending) return;
    setSending(true);
    setError(null);
    try {
      const bowls = [...cart, bowlOf(d)];
      const res = await post<{ num: number; cook: string }>("/api/orders", { kiosk, name, bowls });
      setLast({ num: res.num, name, cook: res.cook, count: bowls.length });
      setD(empty());
      setCart([]);
      setStep(7);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oups, la cuisine ne répond pas. Réessaie !");
    } finally {
      setSending(false);
    }
  }

  /** Range le bol en cours dans la commande et en commence un nouveau. */
  function addBowl() {
    if (cart.length + 1 >= MAX_BOWLS) return;
    setCart((c) => [...c, bowlOf(d)]);
    setD((x) => ({ ...empty(), name: x.name }));
    setStep(1);
  }

  /** Retire le bol en cours : le précédent redevient le bol en cours. */
  function dropCurrent() {
    if (!cart.length) return;
    const prev = cart[cart.length - 1];
    setCart((c) => c.slice(0, -1));
    setD((x) => ({ ...prev, name: x.name }));
    setStep(6);
  }

  function back() {
    if (step === 1 && cart.length) return dropCurrent();
    setStep((s) => Math.max(0, s - 1));
  }

  const bowlNo = cart.length + 1;

  if (!box) return <div className="k-outer" />;

  return (
    <div className="k-outer" onPointerDown={() => setTouch((n) => n + 1)}>
      <div className="k-screen" style={{ zoom: box.zoom, width: box.width, height: box.height }}>
        {step === 0 && (
          <button className="k-welcome" onClick={start} style={{ background: welcomeBg }}>
            <span className="k-kiosk" style={{ color: welcomeInk }}>Borne {kiosk}</span>
            <div className="k-welcome-mid">
              <Bowl size={200} border={7} fill={MANGUE} stick={12} />
              <span className="k-word bagel">Poké<br />Ma-Ma</span>
              <span className="k-hello hand" style={{ color: welcomeInk }}>Aloha…</span>
            </div>
            <span className="k-go bagel">Touche pour commander</span>
          </button>
        )}

        {st && (
          <>
            <header className="k-head">
              <div className="k-brand">
                <Bowl size={52} />
                <span className="bagel">Poké Ma-Ma</span>
              </div>
              <div className="k-prog">
                {STEPS.map((x) => {
                  const cur = x.n === step;
                  return (
                    <span key={x.n} className="bagel" style={{ background: cur ? NORI : x.n < step ? x.color : RIZ, color: cur ? RIZ : NORI }}>
                      {x.n}
                    </span>
                  );
                })}
              </div>
            </header>
            <div className="k-body" ref={bodyRef}>
              <div className="k-title">
                <span className="eyebrow">
                  Étape {st.n} sur 5{cart.length > 0 && <span className="k-bowlno"> · Bol {bowlNo}</span>}
                </span>
                <h1 className="bagel">{st.title}</h1>
                <span className="hand">{st.hint}</span>
              </div>
              <div className="k-grid">
                {st.items.map(([label, color]) => {
                  const v = d[st.key];
                  const sel = st.multi ? (v as string[]).includes(label) : v === label;
                  const selBg = st.color === "#FFFFFF" || st.color === RIZ ? MANGUE : st.color;
                  return (
                    <button
                      key={label}
                      className={`k-opt${sel ? " on" : ""}`}
                      style={{ background: sel ? selBg : "#fff" }}
                      onClick={() => toggle(st.key, label, st.multi)}
                      aria-pressed={sel}
                    >
                      <span className="k-swatch" style={{ background: color }} />
                      <span className="bagel k-opt-label">{label}</span>
                      {sel && <span className="k-check">✓</span>}
                    </button>
                  );
                })}
              </div>
              {st.key === "proteine" && d.proteine && (
                <div className="k-qty">
                  <span className="bagel">Combien de morceaux ?</span>
                  <div className="k-qty-ctl">
                    <button aria-label="Moins" onClick={() => setD((x) => ({ ...x, qty: Math.max(1, x.qty - 1) }))}>−</button>
                    <span className="bagel">{d.qty}</span>
                    <button aria-label="Plus" className="plus" onClick={() => setD((x) => ({ ...x, qty: Math.min(9, x.qty + 1) }))}>+</button>
                  </div>
                </div>
              )}
            </div>
            <footer className="k-foot">
              <button className="k-back" onClick={back}>Retour</button>
              <button className="k-next bagel" style={{ opacity: canNext ? 1 : 0.35 }} aria-disabled={!canNext} onClick={() => canNext && setStep((s) => s + 1)}>
                {step === 5 ? "Voir mon bol" : "Suivant"}
              </button>
            </footer>
          </>
        )}

        {step === 6 && (
          <>
            <header className="k-head">
              <span className="bagel k-brand-txt">Poké Ma-Ma</span>
              <span className="eyebrow k-ton">Ton bol</span>
            </header>
            <div className="k-body" ref={bodyRef}>
              <h1 className="bagel k-h1">C’est bon ?</h1>
              {cart.length > 0 && (
                <div className="k-cart">
                  {cart.map((b, i) => (
                    <div key={i} className="k-cart-row">
                      <span className="k-cart-n bagel">Bol {i + 1}</span>
                      <span className="k-cart-txt">{summary(b)}</span>
                      <button className="k-change" onClick={() => setCart((c) => c.filter((_, j) => j !== i))}>Retirer</button>
                    </div>
                  ))}
                </div>
              )}
              {cart.length > 0 && (
                <div className="k-current">
                  <span className="bagel">Bol {bowlNo}</span>
                  <button className="k-change" onClick={dropCurrent}>Retirer</button>
                </div>
              )}
              <div className="k-recap">
                {STEPS.map((x, i) => (
                  <button key={x.key} onClick={() => setStep(i + 1)}>
                    <span className="k-recap-n bagel" style={{ background: x.color }}>{x.n}</span>
                    <span className="k-recap-txt">
                      <span className="eyebrow">{x.title}</span>
                      <span>{f[x.key]}</span>
                    </span>
                    <span className="k-change">Changer</span>
                  </button>
                ))}
              </div>
              {bowlNo < MAX_BOWLS && (
                <button className="k-add bagel" onClick={addBowl}>+ Ajouter un autre bol</button>
              )}
              <label className="k-name">
                <span className="bagel">Ton prénom</span>
                <input
                  value={d.name}
                  onChange={(e) => setD((x) => ({ ...x, name: e.target.value }))}
                  placeholder="Pour qu’on t’appelle"
                  maxLength={40}
                  autoComplete="off"
                  enterKeyHint="send"
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
              </label>
              {error && <span className="k-error">{error}</span>}
            </div>
            <footer className="k-foot">
              <button className="k-back" onClick={() => setStep(5)}>Retour</button>
              <button className="k-send bagel" style={{ opacity: d.name.trim() && !sending ? 1 : 0.4 }} aria-disabled={!d.name.trim()} onClick={send}>
                {sending ? "J’envoie…" : cart.length ? `Envoyer les ${bowlNo} bols` : "Envoyer en cuisine"}
              </button>
            </footer>
          </>
        )}

        {step === 7 && last && (
          <div className="k-done">
            <span className="hand k-merci">Merci {last.name} !</span>
            <div className="k-ticket">
              <span className="eyebrow">Ta commande</span>
              <span className="bagel">{last.num}</span>
            </div>
            <span className="k-cookline">
              {last.count > 1
                ? `${last.cook} prépare tes ${bowlsLabel(last.count)}. On te les apporte à table.`
                : `${last.cook} prépare ton bol. On te l’apporte à table.`}
            </span>
            <span className="hand k-ecoute">Écoute bien : « Tenez ! »</span>
            <button className="k-again bagel" onClick={reset}>Nouvelle commande</button>
          </div>
        )}
      </div>
    </div>
  );
}
