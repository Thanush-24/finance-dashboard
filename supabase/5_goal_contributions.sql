-- =============================================================
-- Goal contributions
-- =============================================================
-- Lets an income transaction be earmarked toward a specific goal. A
-- goal's progress is the sum of income transactions pointing at it via
-- goal_id, not the account's overall balance — a user can save toward
-- several goals independently by choosing which goal each income
-- transaction contributes to. on delete set null so deleting a goal
-- doesn't delete the transactions that were contributed to it.
alter table public.transactions
  add column goal_id uuid references public.goals (id) on delete set null;

create index transactions_goal_id_idx
  on public.transactions (goal_id)
  where goal_id is not null;
