## Lokalni setup 

1. **Kreiraj Supabase projekat** na https://supabase.com/dashboard
2. **Pokreni migracije** u Supabase SQL Editor (redom):
   - `supabase/migrations/0001_initial.sql`
   - `supabase/migrations/0002_user_settings.sql`
3. **Kopiraj env varijable**:
   ```bash
   cp .env.local.example .env.local
   # uredi .env.local — paste URL + anon key
   # Dodaj API_KEY_ENCRYPTION_SECRET (generiraj ga pomoću `openssl rand -base64 32`)
   ```
4. **Instaliraj ovisnosti i pokreni dev server**:
   ```bash
   npm install
   npm run dev
   ```
5. **Pokreni testove**:
   ```bash
   npm test
   ```

## Test Running

To run tests and verify the application works correctly:

1. Ensure you have `API_KEY_ENCRYPTION_SECRET` set in your `.env.local` file
2. Run `npm test` to execute all test suites
3. All tests should pass (15/15 tests passing)

## Environment Variables

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `API_KEY_ENCRYPTION_SECRET` - Secret key for encrypting API keys (generate with `openssl rand -base64 32`)

> **Note**: `API_KEY_ENCRYPTION_SECRET` is required for encrypting user API keys before storing them in the database. This is a server-side only variable and should never be exposed to the client.
