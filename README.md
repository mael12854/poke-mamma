# Poké Ma-Ma

Le poké bowl de la maison — restaurant de famille, sur invitation (Maël, Marin & Renaud).

| Route | Écran |
|---|---|
| `/` | Site (présentation, carte, demande de réservation) |
| `/borne?id=1`, `/borne?id=2` | Borne de commande, portrait tactile (option `&bg=mangue` ou `&bg=avocat`) |
| `/cuisine` | Écran cuisine, commandes en direct |
| `/gerant` | Interface gérant (code secret) |

## Stack
Next.js (App Router) + TypeScript, données dans Supabase (Postgres). Les écrans se mettent
à jour en direct via Supabase Realtime (broadcast) et se rafraîchissent aussi toutes les 3–5 s.

Toutes les lectures/écritures passent par les routes `/api/*` côté serveur, qui appellent des
fonctions Postgres protégées par un jeton (`PM_API_TOKEN`). La clé publique Supabase seule ne
permet pas de lire ou modifier les données.

## Variables d’environnement
Voir `.env.example` :

- `NEXT_PUBLIC_SUPABASE_URL` — URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — clé publique (anon)
- `PM_API_TOKEN` — jeton serveur : `select token from pm_secret;` dans Supabase
- `GERANT_CODE` — code pour entrer dans `/gerant`

## En local
```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev                   # http://localhost:3000
```

## Base de données
Le schéma est dans `supabase/migrations/0001_poke_mamma.sql` (à lancer une fois dans le SQL editor
d’un projet Supabase neuf).
