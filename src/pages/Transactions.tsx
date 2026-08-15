import { AlertCircle } from "lucide-react";
import { useTransactions, type Transaction } from "../hooks/useTransactions";
import AddTransactionForm from "../components/AddTransactionForm";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const amountFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

function formatAmount(transaction: Transaction) {
  const formatted = amountFormatter.format(transaction.amount);
  return transaction.type === "income" ? `+${formatted}` : `−${formatted}`;
}

function TransactionsSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none">
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="w-32 py-2.5 pr-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
              Date
            </th>
            <th className="py-2.5 pr-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
              Category
            </th>
            <th className="py-2.5 pr-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
              Description
            </th>
            <th className="w-40 py-2.5 text-right font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3].map((row) => (
            <tr key={row} className="border-t border-line">
              <td className="py-3 pr-4">
                <div className="h-3.5 w-20 rounded bg-paper-dim" />
              </td>
              <td className="py-3 pr-4">
                <div className="h-3.5 w-24 rounded bg-paper-dim" />
              </td>
              <td className="py-3 pr-4">
                <div className="h-3.5 w-40 rounded bg-paper-dim" />
              </td>
              <td className="py-3">
                <div className="ml-auto h-3.5 w-20 rounded bg-paper-dim" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <p className="font-body text-sm font-medium text-ink">
        No transactions yet.
      </p>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Transactions you add will appear here.
      </p>
    </div>
  );
}

function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <caption className="sr-only">Your transactions</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="w-32 py-2.5 pr-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft"
            >
              Date
            </th>
            <th
              scope="col"
              className="py-2.5 pr-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft"
            >
              Category
            </th>
            <th
              scope="col"
              className="py-2.5 pr-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft"
            >
              Description
            </th>
            <th
              scope="col"
              className="w-40 py-2.5 text-right font-body text-xs font-medium uppercase tracking-wide text-ink-soft"
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="border-t border-line">
              <td className="py-3 pr-4 font-body text-sm text-ink-soft">
                {dateFormatter.format(new Date(`${transaction.date}T00:00:00`))}
              </td>
              <td className="break-words py-3 pr-4 font-body text-sm text-ink">
                {transaction.category}
              </td>
              <td className="break-words py-3 pr-4 font-body text-sm text-ink-soft">
                {transaction.description || (
                  <span className="text-ink-soft/60">—</span>
                )}
              </td>
              <td
                className={`py-3 text-right font-mono text-sm tabular-nums ${
                  transaction.type === "income" ? "text-ledger" : "text-ink"
                }`}
              >
                {formatAmount(transaction)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Transactions() {
  const { transactions, loading, error, refetch } = useTransactions();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Transactions
      </h1>

      {!loading && !error && (
        <p className="mt-1 font-body text-sm text-ink-soft">
          {transactions.length}{" "}
          {transactions.length === 1 ? "transaction" : "transactions"}
        </p>
      )}

      <div className="mt-6">
        <AddTransactionForm onAdded={refetch} />
      </div>

      <div className="mt-6">
        {error && (
          <div
            aria-live="polite"
            className="flex items-start gap-2 rounded-md border border-rust/30 bg-rust/5 px-3 py-2 font-body text-sm text-rust"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0">
              Couldn&rsquo;t load transactions. Try refreshing the page.
            </span>
          </div>
        )}

        {!error && loading && <TransactionsSkeleton />}

        {!error && !loading && transactions.length === 0 && <EmptyState />}

        {!error && !loading && transactions.length > 0 && (
          <TransactionsTable transactions={transactions} />
        )}
      </div>
    </div>
  );
}

export default Transactions;
