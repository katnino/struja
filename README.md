# Struja

Aplikacija za individualni obračun utroška električne energije, izračun prosječne potrošnje i procjenu iznosa mjesečnog računa  slikanjem mjerila za potrošače Elektroprivrede Republike Srpske (ERS) po REERS blok tarifi. Zasad je podržana foto ekstrakcija samo sa analognih, starih satova, dok ostali imaju opciju manuelnog unosa.

Postupak:

1. Prijavi se / sign in https://www.struja-aplikacija.vercel.app
2. Dodaj jedno ili više brojila
3. Svaki mjesec unesi novo očitanje (sliku) i aplikacija automatski računa potrošnju i izdaje račun naspram predhodnog stanja.
4. Pregled istorije računa po brojilu.
5. Algoritam procijene potrošnje.
6. Moguće je pratiti više mjernih mjesta, ili imati više varijanti jednog mjernog mjesta
7. Izvod mjerenja u PDF formatu

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

## Napomena

Aplikacija je u beta fazi tj. ranom razvoju i moguće su neželjene promjene. Slike se ne čuvaju. 

## Licenca

PolyForm Strict License 1.0.0
https://polyformproject.org/licenses/strict/1.0.0
