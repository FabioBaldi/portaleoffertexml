create extension if not exists pgcrypto;

create table if not exists public.checkout_unlocks (
  id uuid primary key default gen_random_uuid(),
  checkout_session_id text not null unique,
  access_token text not null unique,
  status text not null check (status in ('pending', 'paid', 'consumed', 'expired', 'failed')),
  customer_email text,
  amount_total integer,
  currency text,
  paid_at timestamptz,
  consumed_at timestamptz,
  consumed_by_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_checkout_unlocks_updated_at on public.checkout_unlocks;

create trigger trg_checkout_unlocks_updated_at
before update on public.checkout_unlocks
for each row
execute function public.set_updated_at();

create index if not exists idx_checkout_unlocks_status on public.checkout_unlocks (status);
