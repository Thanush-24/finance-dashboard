import { Link } from "react-router-dom";
import { ArrowLeft, Printer, AlertCircle } from "lucide-react";
import { useTransactions, type Transaction } from "../hooks/useTransactions";
import {
  currentMonthKey,
  filterByMonth,
  sumByType,
} from "../lib/dashboardAnalytics";
import { amountFormatter, dateFormatter } from "../lib/formatters";

const monthLabelFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

function formatAmount(transaction: Transaction) {
  const formatted = amountFormatter.format(transaction.amount);
  return transaction.type === "income" ? `+${formatted}` : `−${formatted}`;
}

function Report() {
  const { transactions, loading, error } = useTransactions();
  const monthTransactions = filterByMonth(transactions, currentMonthKey())
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const income = sumByType(monthTransactions, "income");
  const expenses = sumByType(monthTransactions, "expense");
  const balance = income - expenses;

  return (
    <div className="min-h-screen bg-paper px-4 py-8 md:px-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between print:hidden">
          <Link
            to="/transactions"
            className="inline-flex touch-manipulation items-center gap-1.5 rounded-sm font-body text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to transactions
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex touch-manipulation items-center gap-2 rounded-md bg-[linear-gradient(135deg,var(--color-button-start),var(--color-button-end))] px-4 py-2 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print / Save as PDF
          </button>
        </div>

        <div className="print-report mt-6 rounded-lg border border-line bg-card p-6 print:rounded-none print:border-0 print:bg-paper print:p-0">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Ledger — Monthly Report
          </h1>
          <p className="mt-1 font-body text-sm text-ink-soft">
            {monthLabelFormatter.format(new Date())}
          </p>

          {error && (
            <div
              aria-live="polite"
              className="mt-6 flex items-start gap-2 rounded-md border border-rust/30 bg-rust/10 px-3 py-2 font-body text-sm text-rust"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span className="min-w-0">
                Couldn&rsquo;t load your data. Try refreshing the page.
              </span>
            </div>
          )}

          {!error && loading && (
            <p className="mt-6 font-body text-sm text-ink-soft">Loading…</p>
          )}

          {!error && !loading && (
            <>
              <div className="mt-6 grid grid-cols-3 gap-4 border-y border-line py-4">
                <div>
                  <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Income
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ledger">
                    {amountFormatter.format(income)}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Expenses
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">
                    {amountFormatter.format(expenses)}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Balance
                  </p>
                  <p
                    className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
                      balance >= 0 ? "text-ledger" : "text-rust"
                    }`}
                  >
                    {amountFormatter.format(balance)}
                  </p>
                </div>
              </div>

              {monthTransactions.length === 0 ? (
                <p className="mt-6 font-body text-sm text-ink-soft">
                  No transactions recorded this month.
                </p>
              ) : (
                <table className="mt-6 w-full text-left">
                  <caption className="sr-only">
                    Transactions for {monthLabelFormatter.format(new Date())}
                  </caption>
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="border-b border-line py-2 pr-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="border-b border-line py-2 pr-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="border-b border-line py-2 pr-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="border-b border-line py-2 text-right font-body text-xs font-medium uppercase tracking-wide text-ink-soft"
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="border-b border-line py-2 pr-4 font-body text-sm text-ink-soft">
                          {dateFormatter.format(
                            new Date(`${transaction.date}T00:00:00`),
                          )}
                        </td>
                        <td className="break-words border-b border-line py-2 pr-4 font-body text-sm text-ink">
                          {transaction.category}
                        </td>
                        <td className="break-words border-b border-line py-2 pr-4 font-body text-sm text-ink-soft">
                          {transaction.description || (
                            <span className="text-ink-soft/60">—</span>
                          )}
                        </td>
                        <td
                          className={`border-b border-line py-2 text-right font-mono text-sm tabular-nums ${
                            transaction.type === "income"
                              ? "text-ledger"
                              : "text-ink"
                          }`}
                        >
                          {formatAmount(transaction)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Report;
