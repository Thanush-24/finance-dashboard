import { useRef, useState } from "react";
import { AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useTransactions, type Transaction } from "../hooks/useTransactions";
import { supabase } from "../lib/supabase";
import TransactionForm from "../components/TransactionForm";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

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

function transactionSummary(transaction: Transaction) {
  const base = `${amountFormatter.format(transaction.amount)} · ${transaction.category} · ${dateFormatter.format(new Date(`${transaction.date}T00:00:00`))}`;
  return transaction.description
    ? `${base} · ${transaction.description}`
    : base;
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
            <th className="w-20 py-2.5 pl-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
              <span className="sr-only">Actions</span>
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
              <td className="py-3 pl-4" />
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

interface TransactionsTableProps {
  transactions: Transaction[];
  editingId: string | null;
  onEdit: (transaction: Transaction) => void;
  onDeleteRequest: (
    transaction: Transaction,
    trigger: HTMLButtonElement,
  ) => void;
}

function TransactionsTable({
  transactions,
  editingId,
  onEdit,
  onDeleteRequest,
}: TransactionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
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
            <th
              scope="col"
              className="w-20 py-2.5 pl-4 font-body text-xs font-medium uppercase tracking-wide text-ink-soft"
            >
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const summary = transactionSummary(transaction);
            const isBeingEdited = transaction.id === editingId;
            return (
              <tr
                key={transaction.id}
                aria-current={isBeingEdited ? "true" : undefined}
                className={`border-t border-line ${
                  isBeingEdited
                    ? "border-l-2 border-l-ledger-light bg-paper-dim/40"
                    : ""
                }`}
              >
                <td className="py-3 pr-4 font-body text-sm text-ink-soft">
                  {dateFormatter.format(
                    new Date(`${transaction.date}T00:00:00`),
                  )}
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
                <td className="py-3 pl-4">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(transaction)}
                      aria-label={`Edit ${summary} transaction`}
                      className="touch-manipulation rounded-md p-1.5 text-ink-soft transition-colors hover:bg-paper-dim hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) =>
                        onDeleteRequest(transaction, event.currentTarget)
                      }
                      aria-label={`Delete ${summary} transaction`}
                      className="touch-manipulation rounded-md p-1.5 text-ink-soft transition-colors hover:bg-rust/10 hover:text-rust focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Transactions() {
  const { transactions, loading, error, refetch } = useTransactions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);

  const editingTransaction =
    transactions.find((t) => t.id === editingId) ?? null;
  const deletingTransaction =
    transactions.find((t) => t.id === deletingId) ?? null;

  function handleEdit(transaction: Transaction) {
    setEditingId(transaction.id);
  }

  function handleDeleteRequest(
    transaction: Transaction,
    trigger: HTMLButtonElement,
  ) {
    deleteTriggerRef.current = trigger;
    setDeleteError(null);
    setDeletingId(transaction.id);
  }

  function handleCancelDelete() {
    setDeletingId(null);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!deletingTransaction) return;
    setDeleting(true);
    const { error: deleteRequestError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deletingTransaction.id);
    setDeleting(false);

    if (deleteRequestError) {
      console.error("[transactions] delete failed:", deleteRequestError);
      setDeleteError("Couldn’t delete this transaction. Try again.");
      return;
    }

    setDeletingId(null);
    if (editingId === deletingTransaction.id) setEditingId(null);
    refetch();
  }

  return (
    <div>
      <div inert={!!deletingTransaction || undefined}>
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
          <TransactionForm
            key={editingId ?? "new"}
            editingTransaction={editingTransaction}
            onSaved={() => {
              setEditingId(null);
              refetch();
            }}
            onCancelEdit={() => setEditingId(null)}
          />
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
            <TransactionsTable
              transactions={transactions}
              editingId={editingId}
              onEdit={handleEdit}
              onDeleteRequest={handleDeleteRequest}
            />
          )}
        </div>
      </div>

      {deletingTransaction && (
        <ConfirmDeleteDialog
          description={transactionSummary(deletingTransaction)}
          deleting={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          triggerRef={deleteTriggerRef}
        />
      )}
    </div>
  );
}

export default Transactions;
