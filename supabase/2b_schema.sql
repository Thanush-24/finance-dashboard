-- =============================================================
-- Transactions
-- =============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  description text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Common query pattern for the analytics dashboard: "this user's
-- transactions in a date range" (monthly totals, last-6-months trend).
create index transactions_user_id_date_idx on public.transactions (user_id, date);

alter table public.transactions enable row level security;

-- Table-level privileges: RLS policies are only evaluated once a role
-- already has table-level access — without these grants, every query
-- fails with "permission denied" before RLS is even consulted. `anon`
-- gets SELECT only (never write) purely so an unauthenticated request
-- resolves to a clean empty result instead of a permission error; RLS
-- (scoped `to authenticated` below) is what actually keeps anon at zero
-- rows regardless.
grant select, insert, update, delete on public.transactions to authenticated;
grant select on public.transactions to anon;

-- SELECT: a user can only read their own transactions. Without this,
-- any authenticated user could read every other user's financial data
-- through the same anon/authenticated API key everyone shares.
create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

-- INSERT: a user can only create transactions attributed to themselves.
-- `with check` validates the *new* row being written — this is what stops
-- a user from inserting a transaction tagged with someone else's user_id.
create policy "transactions_insert_own"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

-- UPDATE: `using` gates which existing rows are even visible to update;
-- `with check` re-validates the row *after* the edit. Both are needed —
-- without the second, a user could edit their own row and reassign its
-- user_id to someone else, orphaning or "gifting" the transaction.
create policy "transactions_update_own"
on public.transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- DELETE: a user can only delete rows they own.
create policy "transactions_delete_own"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);


-- =============================================================
-- Budgets
-- =============================================================
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  monthly_limit numeric not null,
  created_at timestamptz not null default now(),
  -- One budget limit per category per user — the Budgets UI edits a
  -- category's limit in place rather than allowing duplicates.
  unique (user_id, category)
);

-- No separate index needed here: the unique constraint above already
-- creates a (user_id, category) index, which also covers the "this
-- user's budget for category X" lookup pattern.

alter table public.budgets enable row level security;

grant select, insert, update, delete on public.budgets to authenticated;
grant select on public.budgets to anon;

create policy "budgets_select_own"
on public.budgets
for select
to authenticated
using (auth.uid() = user_id);

create policy "budgets_insert_own"
on public.budgets
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "budgets_update_own"
on public.budgets
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "budgets_delete_own"
on public.budgets
for delete
to authenticated
using (auth.uid() = user_id);
