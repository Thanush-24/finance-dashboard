-- =============================================================
-- Savings goals
-- =============================================================
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  target_date date not null,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

grant select, insert, update, delete on public.goals to authenticated;
grant select on public.goals to anon;

create policy "goals_select_own"
on public.goals
for select
to authenticated
using (auth.uid() = user_id);

create policy "goals_insert_own"
on public.goals
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "goals_update_own"
on public.goals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "goals_delete_own"
on public.goals
for delete
to authenticated
using (auth.uid() = user_id);


-- =============================================================
-- Recurring transactions
-- =============================================================
-- is_recurring marks a transaction as a monthly template (when
-- recurring_parent_id is null) or an auto-generated instance of one
-- (when recurring_parent_id points back to the template). The app
-- checks on load whether each template's latest instance is behind
-- the current month and backfills the missing months client-side —
-- there's no server-side cron in this stack.
alter table public.transactions
  add column is_recurring boolean not null default false,
  add column recurring_parent_id uuid references public.transactions (id) on delete set null;

create index transactions_recurring_parent_idx
  on public.transactions (recurring_parent_id)
  where recurring_parent_id is not null;
