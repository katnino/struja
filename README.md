# Struja

Aplikacija za individualni obračun utroška električne energije, izračun prosječne potrošnje i procjenu iznosa mjesečnog računa  slikanjem mjerila za potrošače Elektroprivrede Republike Srpske (ERS) po REERS blok tarifi. Zasad je podržana foto ekstrakcija samo sa analognih, starih satova, dok ostali imaju opciju manuelnog unosa.

## 1. Pregled Projekta

**Struja** je web aplikacija izgrađena za individualne potrošače električne energije u Republici Srpskoj (ERS). Omogućava:
- Praćenje stanja na dvotarifnim (VT/MT) električnim brojilima.
- Automatski obračun mjesečnog računa prema službenim **REERS blok tarifama** (Odluka od 17.12.2024, primjena od 01.06.2026).
- Ekstrakciju stanja sa fotografija analognih mjernih satova pomoću **AI Vision** (Google Gemini, Anthropic ili OpenAI).
- Procjenu potrošnje i iznosa računa za tekući mjesec na osnovu Dnevnog Run-Rate algoritma.
- Generisanje i preuzimanje računa/izvoda u **PDF** formatu.

---

## 2. Tehnološki Stek (Tech Stack)

| Sloj | Tehnologije |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](file:///Users/noniboy/ers-calculator/package.json) (App Router, Server Actions, Edge Proxy) |
| **UI Library** | React 19, Tailwind CSS v4 (`@tailwindcss/postcss`) |
| **Backend & DB** | Supabase (PostgreSQL sa Row Level Security — RLS, `@supabase/ssr`) |
| **AI Vision** | Google Gemini (`gemini-2.5-flash`), Anthropic (`claude-3-5-sonnet`), OpenAI (`gpt-4o`) |
| **Kriptografija** | Node.js native `crypto` (AES-256-GCM sa `scryptSync` enkripcijom korisničkih API ključeva) |
| **PDF Generisanje** | `jspdf` |
| **Testing** | Vitest (`vitest run` — 21 prolazni test za formatiranje, matematiku tarifa i enkripciju) |

---

## 3. Struktura Projekta

```
/Users/noniboy/ers-calculator/
├── src/
│   ├── app/
│   │   ├── actions/          # Server Actions za Auth, Brojila, Očitanja, Podešavanja
│   │   ├── api/              # API Rute (/api/tariffs, /api/vision)
│   │   ├── login/, signup/   # Stranice za autentifikaciju
│   │   ├── meters/           # Detalji brojila, unos očitanja, pregled računa
│   │   └── page.tsx          # Glavna kontrolna tabla (Dashboard)
│   ├── components/           # Reusable UI (BillBreakdown, MonthOutlookCard, CameraCapture, ApiKeyModal, PdfDownload)
│   ├── lib/
│   │   ├── tariff.ts         # Matematika obračuna blok tarifa REERS
│   │   ├── outlook.ts        # Algoritam za procjenu mjesečne potrošnje
│   │   ├── crypto.ts         # Enkripcija/dekripcija API ključeva (AES-256-GCM)
│   │   ├── db.ts             # Supabase typed helperi i upiti
│   │   └── vision/           # Adapteri za AI provajdere (Google, Anthropic, OpenAI)
│   └── proxy.ts              # Next.js 16 Auth Middleware / Edge Proxy
├── supabase/
│   └── migrations/           # SQL Migracije (0001_initial.sql, 0002_user_settings.sql)
├── db-encryption.patch       # Patch za enkripciju API ključeva u bazi
├── struja-outlook.patch      # Patch za prikaz procjene potrošnje na detaljima brojila
└── vitest.config.ts          # Konfiguracija za Vitest testove
```

---

## 4. Ključne Komponente i Algoritmi

### 4.1. Algoritam Obračuna Blok Tarife ([tariff.ts](file:///Users/noniboy/ers-calculator/src/lib/tariff.ts))
Obračun se vrši po REERS dual-tariff modelu:
1. **Podjela na blokove**:
   - **Blok I**: 0 – 500 kWh
   - **Blok II**: 501 – 1500 kWh
   - **Blok III**: > 1500 kWh
2. **Udio tarifa (VT / MT)**: Ukupna potrošnja se dijeli po srazmjernom učešću više (VT) i manje (MT) tarife u svakom bloku.
3. **Mrežarina i Naknade**:
   - Prenosna i distributivna mrežarina (takođe raspodijeljene po VT/MT).
   - Naknada za obnovljive izvore energije (OIE).
   - Fiksni troškovi: Usluga mjernog mjesta (2.48 KM) i obračunska snaga po odobrenom kW.
4. **PDV**: 17% na ukupni osnovni iznos.

### 4.2. Algoritam Procjene Potrošnje / Outlook ([outlook.ts](file:///Users/noniboy/ers-calculator/src/lib/outlook.ts))
- **Aktuelna potrošnja**: Mjeri se razlika između najnovijeg očitanja u tekućem mjesecu i baznog očitanja prije početka mjeseca.
- **Run-Rate**: Izračunava prosječnu dnevnu potrošnju na osnovu rotirajućeg prozora zadnja 3 dana (`ROLLING_WINDOW_DAYS = 3`).
- **Projekcija**: Pomnoži dnevni pace sa preostalim danima u mjesecu i sabira sa izmjerenom potrošnjom. Rezultat se šalje u `calculateBill` funkciju.

### 4.3. AI Vision Ekstrakcija Brojila ([types.ts](file:///Users/noniboy/ers-calculator/src/lib/vision/types.ts))
- Ekstrahuje stanje sa 2 reda mehaničkih točkića sa analognih satova:
  - **Gornji red (VT)**: 5 bijelih/crnih glavnih cifara.
  - **Donji red (MT)**: 5 bijelih/crnih glavnih cifara.
  - **Zanemaruje**: Crvenu decimalnu cifru desno i serijske brojeve uređaja.
- Koristi privatni API ključ korisnika koji se enkriptovan čuva u `user_settings`.

### 4.4. Sigurnost i Kriptografija ([crypto.ts](file:///Users/noniboy/ers-calculator/src/lib/crypto.ts))
- Korisnički AI API ključevi se enkriptuju prije upisa u bazu pomoću **AES-256-GCM** sa `v1:<iv>:<authTag>:<ciphertext>` formatom.
- Šiti ključeve čak i u slučaju direktnog pristupa bazi podataka ili curenja servisa.
- Supabase Row Level Security (RLS) obezbjeđuje da svaki korisnik ima pristup samo svojim brojilima, očitanjima i računima (`auth.uid() = user_id`).

---

## 5. Status Testova

Svi definisani unit testovi u projektu su provjereni i prolaze u potpunosti:
- [format.test.ts](file:///Users/noniboy/ers-calculator/src/lib/format.test.ts): 6 testova (formatiranje brojeva/valuta)
- [tariff.test.ts](file:///Users/noniboy/ers-calculator/src/lib/tariff.test.ts): 6 testova (tačnost obračuna po blokovima i naknadama)
- [crypto.test.ts](file:///Users/noniboy/ers-calculator/src/lib/crypto.test.ts): 9 testova (AES-256-GCM enkripcija, dekripcija, pogrešne lozinke, kompatibilnost)

**Rezultat**: 21 / 21 pasiranih testova.

## Napomena

Aplikacija je u beta fazi tj. ranom razvoju i moguće su neželjene promjene. Slike se ne čuvaju. 

## Licenca

PolyForm Strict License 1.0.0
https://polyformproject.org/licenses/strict/1.0.0
