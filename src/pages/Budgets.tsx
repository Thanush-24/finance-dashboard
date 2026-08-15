import { useMemo, useState } from "react";
import { AlertCircle, Pencil } from "lucide-react";
import { useBudgets, type Budget } from "../hooks/useBudgets";
import { useTransactions } from "../hooks/useTransactions";
import {
  currentMonthKey,
  filterByMonth,
  groupExpensesByCategory,
} from "../lib/dashboardAnalytics";
import { amountFormatter } from "../lib/formatters";
import BudgetForm from "../components/BudgetForm";

function BudgetsSkeleton() {
  return (
    <div className="mt-6 animate-pulse motion-reduce:animate-none">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((row) => (
          <div key={row} className="rounded-lg border border-line bg-white p-5">
            <div className="h-3.5 w-24 rounded bg-paper-dim" />
            <div className="mt-3 h-4 w-40 rounded bg-paper-dim" />
            <div className="mt-3 h-2 w-full rounded-full bg-paper-dim" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetsEmptyState() {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-line px-6 py-16 text-center">
      <p className="font-body text-base font-medium text-ink">
        No budgets set yet.
      </p>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Set a monthly limit per category above to start tracking against it.
      </p>
    </div>
  );
}

interface BudgetRowProps {
  budget: Budget;
  actualSpend: number;
  onEdit: (budget: Budget) => void;
}

function BudgetRow({ budget, actualSpend, onEdit }: BudgetRowProps) {
  const percent =
    budget.monthly_limit > 0 ? (actualSpend / budget.monthly_limit) * 100 : 0;
  const isOverBudget = actualSpend > budget.monthly_limit;
  const barWidth = Math.min(percent, 100);

  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-body text-sm font-medium text-ink">
          {budget.category}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(budget)}
          aria-label={`Edit ${budget.category} budget`}
          className="touch-manipulation rounded-md p-1.5 text-ink-soft transition-colors hover:bg-paper-dim hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-2 font-mono text-sm tabular-nums">
        <span
          className={
            isOverBudget ? "font-semibold text-rust" : "font-semibold text-ink"
          }
        >
          {amountFormatter.format(actualSpend)}
        </span>
        <span className="text-ink-soft">
          {" "}
          / {amountFormatter.format(budget.monthly_limit)}
        </span>
      </p>

      <div
        role="progressbar"
        aria-valuenow={Math.round(barWidth)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${budget.category} spending: ${Math.round(percent)}% of budget`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-paper-dim"
      >
        <div
          className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${
            isOverBudget ? "bg-rust" : "bg-ledger"
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <p
        className={`mt-2 font-body text-xs ${
          isOverBudget ? "font-medium text-rust" : "text-ink-soft"
        }`}
      >
        {isOverBudget
          ? `Over budget by ${amountFormatter.format(actualSpend - budget.monthly_limit)}`
          : `${Math.round(percent)}% of budget`}
      </p>
    </div>
  );
}

function Budgets() {
  const { budgets, loading, error, refetch } = useBudgets();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingBudget = budgets.find((b) => b.id === editingId) ?? null;

  const spendByCategory = useMemo(() => {
    const currentMonthExpenses = filterByMonth(transactions, currentMonthKey());
    const totals = new Map(
      groupExpensesByCategory(currentMonthExpenses).map((c) => [
        c.category,
        c.total,
      ]),
    );
    return totals;
  }, [transactions]);

  function handleEdit(budget: Budget) {
    setEditingId(budget.id);
  }

  const isLoading = loading || transactionsLoading;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Budgets</h1>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Monthly limits by category
      </p>

      <div className="mt-6">
        <BudgetForm
          key={editingId ?? "new"}
          editingBudget={editingBudget}
          onSaved={() => {
            setEditingId(null);
            refetch();
          }}
          onCancelEdit={() => setEditingId(null)}
        />
      </div>

      {error && (
        <div
          aria-live="polite"
          className="mt-6 flex items-start gap-2 rounded-md border border-rust/30 bg-rust/5 px-3 py-2 font-body text-sm text-rust"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            Couldn&rsquo;t load your budgets. Try refreshing the page.
          </span>
        </div>
      )}

      {!error && isLoading && <BudgetsSkeleton />}

      {!error && !isLoading && budgets.length === 0 && <BudgetsEmptyState />}

      {!error && !isLoading && budgets.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {budgets.map((budget) => (
            <BudgetRow
              key={budget.id}
              budget={budget}
              actualSpend={spendByCategory.get(budget.category) ?? 0}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Budgets;
