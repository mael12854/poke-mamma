"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Bowl } from "./Bowl";
import { ReserveForm } from "./ReserveForm";
import { openingHero, places } from "@/lib/dates";
import type { PublicOpening } from "@/lib/types";
import "./site.css";

const LINKS = [
  ["#carte", "La carte"],
  ["#comment", "Comment ça marche"],
  ["#equipe", "L’équipe"],
] as const;

const CARTE = [
  { n: 1, title: "Base riz", items: "Petite · Moyenne · Grande", bg: "var(--riz)", dot: "var(--blanc)" },
  { n: 2, title: "Légumes", items: "Avocat · Edamame · Mangue · Concombre · Petits pois · Coriandre", bg: "var(--avocat)", dot: "var(--riz)" },
  { n: 3, title: "Protéines", items: "Saumon cru · Saumon cuit", bg: "var(--saumon)", dot: "var(--riz)" },
  { n: 4, title: "Tips", items: "Soja sucré · Soja salé · Fromage frais · Wasabi · Sésame · Algues", bg: "var(--mangue)", dot: "var(--riz)" },
];

export function Site({ initialOpenings }: { initialOpenings: PublicOpening[] }) {
  const [openings, setOpenings] = useState(initialOpenings);
  const [menu, setMenu] = useState(false);
  const next = openings[0];

  async function refresh() {
    try {
      const res = await fetch("/api/openings", { cache: "no-store" });
      if (res.ok) setOpenings((await res.json()).openings);
    } catch {}
  }

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  return (
    <div className="site">
      <header className="s-nav">
        <a href="#" className="s-brand" aria-label="Poké Mamma, accueil">
          <Bowl size={48} />
          <span className="bagel">Poké Mamma</span>
        </a>
        <nav className="s-links">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
          <a href="#reserver" className="s-navcta">Réserver ma place</a>
        </nav>
        <button className="s-menubtn" onClick={() => setMenu(true)} aria-expanded={menu}>Menu</button>
      </header>

      {menu && (
        <div className="s-overlay" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="s-overlay-top">
            <span className="s-brand"><Bowl size={38} /><span className="bagel">Poké Mamma</span></span>
            <button className="s-menubtn" onClick={() => setMenu(false)}>Fermer</button>
          </div>
          <nav>
            {LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenu(false)} className="bagel">{label}</a>
            ))}
            <a href="#reserver" onClick={() => setMenu(false)} className="s-cta">Réserver ma place</a>
          </nav>
          <span className="hand s-overlay-aside">Konnichiwa…</span>
        </div>
      )}

      <section className="s-hero">
        <div className="s-hero-text">
          <span className="s-tag">
            <span className="d-only">Restaurant de famille · sur invitation</span>
            <span className="m-only">Sur invitation</span>
          </span>
          <h1 className="bagel">Le poké bowl de la maison.</h1>
          <p>
            Inventé par Maël (10 ans) et Marin (6 ans).
            <span className="d-only"> Tu composes ton bol, ils le préparent, et ils te disent « Tenez ! ».</span>
          </p>
        </div>
        <figure className="s-drawing">
          <Image src="/dessin.png" alt="La fameuse ouverture de Poké Mamma" width={1940} height={1370} priority sizes="(max-width: 900px) 100vw, 560px" />
          <figcaption className="hand">La fameuse ouverture, dessinée par Maël</figcaption>
        </figure>
        <div className="s-hero-actions">
          <a href="#reserver" className="s-cta">Réserver ma place</a>
          <div className="s-next">
            <span className="s-next-txt">
              <span className="eyebrow">Prochaine ouverture</span>
              <span className="s-next-when">{next ? openingHero(next) : "Bientôt, promis"}</span>
            </span>
            {next && <span className="hand s-next-left">{next.left > 0 ? places(next.left) : "Complet"}</span>}
          </div>
        </div>
      </section>

      <section id="carte" className="s-carte">
        <div className="s-head">
          <h2 className="bagel">La carte</h2>
          <span>Compose ton bol en 4 étapes.</span>
        </div>
        <div className="s-carte-grid">
          {CARTE.map((c) => (
            <div key={c.n} className="s-carte-card" style={{ background: c.bg }}>
              <span className="s-num bagel" style={{ background: c.dot }}>{c.n}</span>
              <span className="s-carte-txt">
                <span className="bagel s-carte-title">{c.title}</span>
                <span className="s-carte-items">{c.items}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="s-extras">
          <div><span className="bagel">Dessert</span><span>Fromage blanc + sucre</span></div>
          <div><span className="bagel">Boisson</span><span>Carafe d’eau</span></div>
        </div>
      </section>

      <section id="comment" className="s-section">
        <h2 className="bagel">Comment ça marche</h2>
        <div className="s-grid3">
          {[
            ["Konnichiwa…", "var(--blanc)", "On t’accueille. Tu composes ton bol sur la borne."],
            ["Tenez !", "var(--saumon)", "Maël, Marin ou Renaud prépare ton bol et te l’apporte."],
            ["Ça a l’air bon", "var(--avocat)", "Toi, tu n’as plus qu’à dire ça. Et à manger."],
          ].map(([bubble, bg, text], i) => (
            <div key={bubble} className="s-step">
              <div className="s-bubble hand" style={{ background: bg }}>{bubble}</div>
              <span><strong>{i + 1}.</strong> {text}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="equipe" className="s-section s-equipe">
        <h2 className="bagel">L’équipe</h2>
        <div className="s-grid3">
          {[
            ["Co-fondateur · 10 ans", "Maël", "Le premier « Ma » de Mamma.", "var(--saumon)"],
            ["Co-fondateur · 6 ans", "Marin", "Le deuxième « Ma » de Mamma.", "var(--avocat)"],
            ["Équipe · 42 ans", "Renaud", "Le papa. Il bosse là-bas aussi.", "var(--mangue)"],
          ].map(([role, name, line, bg]) => (
            <div key={name} className="s-member" style={{ background: bg }}>
              <span className="eyebrow">{role}</span>
              <span className="bagel">{name}</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="reserver" className="s-reserve">
        <div className="s-reserve-text">
          <h2 className="bagel">Réserver ma place</h2>
          <p>Seulement pour la famille. On te garde une chaise et un bol.</p>
          <span className="hand">Pas besoin de payer, c’est maison.</span>
        </div>
        <ReserveForm openings={openings} onSent={refresh} />
      </section>

      <footer className="s-footer">
        <span className="bagel">Poké Mamma</span>
        <span>Maël, Marin &amp; Renaud · Pas ouvert au public</span>
      </footer>
    </div>
  );
}
