# Ledger — Personal Finance Dashboard

A personal finance management dashboard: track income and expenses, set
per-category monthly budgets, and see spending trends at a glance.

## Features

- **Auth** — email/password signup and login (Supabase Auth), protected
  routes, session persistence across refresh
- **Transactions** — add, edit, and delete income/expense entries, scoped
  to the logged-in user
- **Analytics dashboard** — income/expense/balance summary (This Month or
  All Time), an expense-by-category pie chart, a 6-month income vs.
  expense trend line, a stacked bar chart of category spend over time,
  and computed plain-language insights
- **Budgets** — set a monthly limit per category, track actual spend
  against it with a progress bar, clear over-budget indicator
- **Recurring transactions** — mark a transaction as monthly (rent,
  subscriptions) and it auto-logs itself each month, backfilling any
  months missed since the last time the app was opened
- **Savings goals** — set a target amount and date; earmark income
  transactions toward a specific goal to track its progress
  independently of your other goals
- **Export** — download transaction history as CSV, or a printable
  monthly report (print-to-PDF)
- **Scan a bill** — upload a receipt image and on-device OCR
  (Tesseract.js) pre-fills the amount, date, category, and
  description for review before saving; the original image is stored
  in Supabase Storage and viewable from the transaction list
- Every table in Postgres has row-level security scoped to `user_id` —
  one user can never read or write another user's data, enforced at the
  database layer, not just hidden in the UI

## Tech stack

| Layer               | Choice                                                       |
| ------------------- | ------------------------------------------------------------ |
| Frontend            | React + Vite + TypeScript + Tailwind CSS                     |
| Routing             | react-router-dom                                             |
| Charts              | Recharts                                                     |
| Icons               | lucide-react                                                 |
| Backend + DB + Auth | Supabase (Postgres, email/password auth, row-level security) |
| Deployment          | Vercel (frontend) + Supabase (backend)                       |

## Running locally

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

The database schema (tables, RLS policies, grants) lives in
[`supabase/2b_schema.sql`](supabase/2b_schema.sql),
[`supabase/4_goals_and_recurring.sql`](supabase/4_goals_and_recurring.sql),
[`supabase/5_goal_contributions.sql`](supabase/5_goal_contributions.sql),
and
[`supabase/6_receipts.sql`](supabase/6_receipts.sql)
— run all four in your Supabase project's SQL Editor before using the app.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck (`tsc -b`) and build for production
- `npm run lint` — ESLint
- `npm run format` — Prettier
