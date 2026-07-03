-- ============================================================================
-- ERS Calculator - Supabase schema
-- Run via: supabase db push   OR   paste into Supabase SQL editor
-- ============================================================================

-- 1. tariff_rates ----------------------------------------------------------
-- Single source of truth for REERS rates. Update this row when REERS
-- publishes new tariff decisions; no code change needed.
create table if not exists public.tariff_rates (
  id                  integer primary key default 1,
  effective_from      date      not null,
  source_label        text      not null,
  mjerno_mjesto       numeric(10,4) not null,
  obracunska_snaga    numeric(10,4) not null,
  oie_rate            numeric(10,6) not null,
  vat                 numeric(5,4)  not null,
  block_i             integer   not null,
  block_ii            integer   not null,
  tg1_i               numeric(10,4) not null,
  tg1_ii              numeric(10,4) not null,
  tg1_iii             numeric(10,4) not null,
  tg2_vt_i            numeric(10,4) not null,
  tg2_vt_ii           numeric(10,4) not null,
  tg2_vt_iii          numeric(10,4) not null,
  tg2_mt_i            numeric(10,4) not null,
  tg2_mt_ii           numeric(10,4) not null,
  tg2_mt_iii          numeric(10,4) not null,
  created_at          timestamptz default now(),
  constraint single_row check (id = 1)
);

-- Seed current REERS (Odluka 15.12.2022, primjena od 01.01.2023.)
insert into public.tariff_rates (
  id, effective_from, source_label,
  mjerno_mjesto, obracunska_snaga, oie_rate, vat,
  block_i, block_ii,
  tg1_i, tg1_ii, tg1_iii,
  tg2_vt_i, tg2_vt_ii, tg2_vt_iii,
  tg2_mt_i, tg2_mt_ii, tg2_mt_iii
) values (
  1, '2023-01-01', 'REERS Odluka 15.12.2022',
  2.48, 3.1668, 0.0007, 0.17,
  500, 1500,
  0.1053, 0.1423, 0.2522,
  0.1324, 0.1770, 0.3094,
  0.0663, 0.0886, 0.1548
) on conflict (id) do nothing;

-- 2. meters ----------------------------------------------------------------
create table if not exists public.meters (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  tariff_group    text not null check (tariff_group in ('TG1','TG2')),
  approved_kw     numeric(5,2) not null check (approved_kw > 0),
  notes           text,
  created_at      timestamptz default now()
);
create index if not exists idx_meters_user on public.meters(user_id);

-- 3. readings --------------------------------------------------------------
-- Each reading is a single point-in-time snapshot of one meter.
-- For TG1: use `reading`. For TG2: use `vt` and `mt`.
create table if not exists public.readings (
  id              uuid primary key default gen_random_uuid(),
  meter_id        uuid not null references public.meters(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  recorded_at     date not null default current_date,
  reading         numeric(12,2),
  vt              numeric(12,2),
  mt              numeric(12,2),
  source          text not null default 'manual' check (source in ('manual','ai','csv')),
  confidence      text check (confidence in ('high','low')),
  created_at      timestamptz default now(),
  check (
    (reading is not null) or (vt is not null and mt is not null)
  )
);
create index if not exists idx_readings_meter on public.readings(meter_id, recorded_at desc);

-- 4. bills -----------------------------------------------------------------
-- A bill is the calculation between two readings. The breakdown_json
-- mirrors the BillResult shape from src/lib/tariff.ts so we can re-render
-- it without re-computing.
create table if not exists public.bills (
  id                  uuid primary key default gen_random_uuid(),
  meter_id            uuid not null references public.meters(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  period_start        date not null,
  period_end          date not null,
  prev_reading_id     uuid references public.readings(id),
  curr_reading_id     uuid references public.readings(id),
  tariff_rates_id     integer references public.tariff_rates(id),
  approved_kw         numeric(5,2) not null,
  consumption_kwh     numeric(12,2) not null,
  mjerno_mjesto       numeric(10,2) not null,
  obracunska_snaga    numeric(10,2) not null,
  energy_cost         numeric(10,2) not null,
  oie_cost            numeric(10,2) not null,
  subtotal            numeric(10,2) not null,
  vat_amount          numeric(10,2) not null,
  total               numeric(10,2) not null,
  blocks              jsonb not null,
  created_at          timestamptz default now(),
  constraint bill_period check (period_end > period_start)
);
create index if not exists idx_bills_meter on public.bills(meter_id, period_end desc);

-- ============================================================================
-- Row Level Security: every user only sees their own rows.
-- ============================================================================

alter table public.tariff_rates  enable row level security;
alter table public.meters        enable row level security;
alter table public.readings      enable row level security;
alter table public.bills         enable row level security;

-- tariff_rates: readable by everyone (it is public reference data).
create policy "tariff_rates_read" on public.tariff_rates
  for select using (true);

-- meters: owner only
create policy "meters_owner_select" on public.meters
  for select using (auth.uid() = user_id);
create policy "meters_owner_insert" on public.meters
  for insert with check (auth.uid() = user_id);
create policy "meters_owner_update" on public.meters
  for update using (auth.uid() = user_id);
create policy "meters_owner_delete" on public.meters
  for delete using (auth.uid() = user_id);

-- readings: owner only
create policy "readings_owner_select" on public.readings
  for select using (auth.uid() = user_id);
create policy "readings_owner_insert" on public.readings
  for insert with check (auth.uid() = user_id);
create policy "readings_owner_update" on public.readings
  for update using (auth.uid() = user_id);
create policy "readings_owner_delete" on public.readings
  for delete using (auth.uid() = user_id);

-- bills: owner only
create policy "bills_owner_select" on public.bills
  for select using (auth.uid() = user_id);
create policy "bills_owner_insert" on public.bills
  for insert with check (auth.uid() = user_id);
create policy "bills_owner_delete" on public.bills
  for delete using (auth.uid() = user_id);

-- updates to bills are intentionally disallowed; bills are append-only
-- historical records. To correct a bill: delete it and re-create one.
