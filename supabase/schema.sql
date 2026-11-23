-- Money Mint database schema
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Every table is private per user via Row Level Security (RLS).

create extension if not exists "pgcrypto";

-- ---------- Accounts (bank, cash, UPI, card, wallet) ----------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'bank' check (type in ('bank','cash','upi','card','wallet')),
  opening_balance numeric(14,2) not null default 0,
  color text not null default '#10B981',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense')),
  icon text not null default '•',
  color text not null default '#64748B',
  created_at timestamptz not null default now()
);

-- ---------- Transactions ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense','transfer')),
  amount numeric(14,2) not null check (amount > 0),
  account_id uuid not null references public.accounts(id) on delete cascade,
  to_account_id uuid references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  date date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now(),
  check ((type = 'transfer') = (to_account_id is not null))
);
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

-- ---------- Monthly budgets per expense category ----------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

-- ---------- Recurring entries & bill reminders ----------
create table if not exists public.recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  frequency text not null check (frequency in ('daily','weekly','monthly','yearly')),
  next_date date not null,
  auto_add boolean not null default true,   -- create the transaction automatically when due
  remind boolean not null default true,     -- phone notification on the due date
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Lend / borrow ----------
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  person text not null,
  direction text not null check (direction in ('lent','borrowed')),
  amount numeric(14,2) not null check (amount > 0),
  date date not null default current_date,
  due_date date,
  note text not null default '',
  settled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  date date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security: each user sees only their own rows ----------
do $$
declare t text;
begin
  foreach t in array array['accounts','categories','transactions','budgets','recurring','loans','loan_payments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t);
  end loop;
end $$;
