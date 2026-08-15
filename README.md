# Ledger — Personal Finance Dashboard

A personal finance management dashboard: track income and expenses, set
per-category monthly budgets, and see spending trends at a glance.

## Features

- **Auth** — email/password signup and login (Supabase Auth), protected
  routes, session persistence across refresh
- **Transactions** — add, edit, and delete income/expense entries, scoped
  to the logged-in user
- **Analytics dashboard** — monthly income/expense/net savings summary,
  an expense-by-category pie chart, a 6-month income vs. expense trend
  line, and computed plain-language insights
- **Budgets** — set a monthly limit per category, track actual spend
  against it with a progress bar, clear over-budget indicator
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
[`supabase/2b_schema.sql`](supabase/2b_schema.sql) — run it in your
Supabase project's SQL Editor before using the app.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck (`tsc -b`) and build for production
- `npm run lint` — ESLint
- `npm run format` — Prettier
