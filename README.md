# ERS Kalkulator (web)

Informativni obračun struje za Elektroprivreda Republike Srpske (ERS) po
REERS blok tarifi (Odluka 15.12.2022, primjena od 01.01.2023.).

User flow:

1. Sign up / sign in (Supabase Auth)
2. Dodaj jedno ili više brojila (TG1 ili TG2, odobrena snaga)
3. Svaki mjesec unesi novo očitanje — diff naspram prethodnog stanja
   automatski računa potrošnju i izdaje račun
4. Pregled historije računa po brojilu

## Stack

- Next.js 16 (App Router, TypeScript, RSC + Server Actions)
- Supabase (Auth, Postgres, Row Level Security)
- Tailwind v4 (custom dark theme, "konzola" estetika iz originalne aplikacije)

## Struktura

```
src/
  app/
    actions/        Server actions (auth, meters, readings)
    api/tariffs/    GET - returns current tariff rates
    login/,signup/  Auth pages
    meters/         Meter detail + readings/new + bills/[billId]
    page.tsx        Dashboard - lista brojila
  lib/
    tariff.ts       Pure calc functions + types (iz originalnog JSX-a)
    db.ts           Typed query helpers (server-side)
    supabase/       Browser + server Supabase klijenti
  components/       Reusable: Header, BillBreakdown
supabase/migrations/0001_initial.sql  Schema + RLS + seed

middleware: src/proxy.ts (renamed middleware u Next.js 16, route protection)
```

## Setup lokalno

1. **Kreiraj Supabase projekat** na https://supabase.com/dashboard
2. **Pokreni migraciju** u Supabase SQL Editor:
   - Otvori `supabase/migrations/0001_initial.sql`
   - Zalijepi u SQL Editor → Run
3. **Kopiraj env varijable** iz Supabase Settings → API:
   ```bash
   cp .env.local.example .env.local
   # uredi .env.local - paste URL + anon key
   ```
4. **Dev server**:
   ```bash
   npm install
   npm run dev
   ```
5. Otvori http://localhost:3000, registruj se, dodaj brojilo, dodaj prvo očitanje.

## Deploy

Bilo koja Next.js platforma: Vercel (preporučeno), Railway, Fly.io.
Env varijable se postavljaju u platform dashboardu.

## TODO (naredne faze)

- AI vizija (slika brojila → Claude/OpenAI/Vision provider pluggable)
- PDF export računa
- Email/push podsjetnik za mjesečno očitanje
- Multi-meter households / dijeljenje računa
- Admin panel za ažuriranje `tariff_rates` kad REERS objavi nove cifre
