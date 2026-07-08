# Struja

Aplikacija za individualni obračun struje i praćenje potrošnje slikanjem mjerila (zasad samo analogni, stari satovi), za potrošače Elektroprivrede Republike Srpske (ERS) po
REERS blok tarifi (Odluka 15.12.2022, primjena od 01.01.2023.). Stanje mjerila je moguće i ručno unjeti.

Postupak:

1. Prijavi se / sign in
2. Dodaj jedno ili više brojila
3. Svaki mjesec unesi novo očitanje (sliku) i aplikacija automatski računa potrošnju i izdaje račun naspram predhodnog stanja.
4. Pregled istorije računa po brojilu.

## Stack

- Next.js 16 (App Router, TypeScript, RSC + Server Actions)
- Supabase (Auth, Postgres, Row Level Security)
- Tailwind v4 (custom dark theme)
- AI: Google Gemini. Svaki korisnik unosi svoj besplatni ključ koji može da preuzme preko direktnog linka u aplikaciji.

## Struktura

```
src/
  app/
    actions/        Server actions (auth, meters, readings, settings)
    api/tariffs/    GET — returns current tariff rates
    api/vision/     POST — AI extraction proxy (user's own key)
    login/,signup/  Auth pages
    meters/         Meter detail + readings/new + bills/[billId]
    page.tsx        Dashboard — lista brojila
  lib/
    tariff.ts       Pure calc functions + types
    db.ts           Typed query helpers (server-side)
    supabase/       Browser + server Supabase klijenti
    vision/         AI provider adapters (Google, Anthropic, OpenAI)
  components/       Reusable: Header, BillBreakdown, ApiKeyModal, PdfDownload
  proxy.ts          Auth middleware (Next.js 16)
supabase/migrations/
  0001_initial.sql    Schema + RLS + REERS seed
  0002_user_settings.sql  User API keys table
```

## Lokalni setup za developere

1. **Kreiraj Supabase projekat** na https://supabase.com/dashboard
2. **Pokreni migracije** u Supabase SQL Editor (redom):
   - `supabase/migrations/0001_initial.sql`
   - `supabase/migrations/0002_user_settings.sql`
3. **Kopiraj env varijable**:
   ```bash
   cp .env.local.example .env.local
   # uredi .env.local — paste URL + anon key
   ```
4. **Dev server**:
   ```bash
   npm install
   npm run dev
   ```
5. Otvori http://localhost:3000, registruj se, dodaj brojilo, dodaj prvo očitanje.
6. Pri prvom AI prepoznavanju unesi besplatni Gemini ključ (link u app).

## Deploy

Bilo koja Next.js platforma: Vercel (preporučeno), Railway, Fly.io.
Env varijable se postavljaju u platform dashboardu.

## Napomena

Aplikacija je u ranom stadijumu razvoja. Zasad su zbog načina obračuna samo mjesečna mjerenja faktuelno ispravna.
