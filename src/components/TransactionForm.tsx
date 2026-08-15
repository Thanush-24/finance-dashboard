import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useGoals } from "../hooks/useGoals";
import type { Transaction } from "../hooks/useTransactions";
import { CATEGORIES } from "../lib/categories";
import { todayISODate } from "../lib/formatters";

const inputClass =
  "w-full rounded-md border border-input-border bg-input-bg px-3 py-2 font-body text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger";

const invalidInputClass = "border-rust/60";

const labelClass = "mb-1.5 block font-body text-sm font-medium text-ink";

const fieldErrorClass = "mt-1 font-body text-xs text-rust";

interface FieldErrors {
  amount?: string;
  category?: string;
  date?: string;
}

interface TransactionFormProps {
  editingTransaction: Transaction | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}

// Mount fresh on every switch between create mode and editing a specific
// row: the parent renders this with key={editingTransaction?.id ?? "new"},
// so local state can simply initialize from the prop rather than syncing
// it via an effect.
function TransactionForm({
  editingTransaction,
  onSaved,
  onCancelEdit,
}: TransactionFormProps) {
  const isEditing = editingTransaction !== null;
  const { session } = useAuth();
  const { goals } = useGoals();
  const [type, setType] = useState<Transaction["type"]>(
    editingTransaction?.type ?? "expense",
  );
  const [amount, setAmount] = useState(
    editingTransaction ? String(editingTransaction.amount) : "",
  );
  const [category, setCategory] = useState(editingTransaction?.category ?? "");
  const [description, setDescription] = useState(
    editingTransaction?.description ?? "",
  );
  const [date, setDate] = useState(editingTransaction?.date ?? todayISODate);
  const [goalId, setGoalId] = useState(editingTransaction?.goal_id ?? "");
  const [isRecurring, setIsRecurring] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (isEditing) {
      formRef.current?.scrollIntoView({ block: "nearest" });
      amountRef.current?.focus();
    }
    // Only on mount: this component remounts fresh (via `key`) whenever
    // edit mode is entered or the edited row changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    const nextFieldErrors: FieldErrors = {};
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextFieldErrors.amount = "Enter an amount greater than 0.";
    }
    if (!category.trim()) {
      nextFieldErrors.category = "Enter a category.";
    }
    if (!date) {
      nextFieldErrors.date = "Select a date.";
    }
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.amount) {
      amountRef.current?.focus();
      return;
    }
    if (nextFieldErrors.category) {
      categoryRef.current?.focus();
      return;
    }
    if (nextFieldErrors.date) {
      dateRef.current?.focus();
      return;
    }

    if (!session) return;

    const payload = {
      amount: parsedAmount,
      category: category.trim(),
      type,
      description: description.trim() || null,
      date,
      goal_id: type === "income" && goalId ? goalId : null,
    };

    setLoading(true);
    const { error: saveError } = isEditing
      ? await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editingTransaction.id)
      : await supabase.from("transactions").insert({
          ...payload,
          user_id: session.user.id,
          is_recurring: isRecurring,
          recurring_parent_id: null,
        });
    setLoading(false);

    if (saveError) {
      console.error(
        `[transactions] ${isEditing ? "update" : "insert"} failed:`,
        saveError,
      );
      setError(
        isEditing
          ? "Couldn’t save these changes. Try again."
          : "Couldn’t add this transaction. Try again.",
      );
      return;
    }

    if (isEditing) {
      onSaved();
      return;
    }

    setType("expense");
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(todayISODate());
    setGoalId("");
    setIsRecurring(false);
    setFieldErrors({});
    amountRef.current?.focus();

    onSaved();
  }

  return (
    <div
      ref={formRef}
      className={`rounded-lg border border-line border-t-2 bg-card p-5 ${
        isEditing ? "border-t-ledger-light" : "border-t-ledger"
      }`}
    >
      <h2 className="font-display text-base font-semibold text-ink">
        {isEditing ? "Edit transaction" : "Add a transaction"}
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        {error && (
          <div
            ref={errorRef}
            aria-live="polite"
            tabIndex={-1}
            className="mb-4 flex items-start gap-2 rounded-md border border-rust/30 bg-rust/5 px-3 py-2 font-body text-sm text-rust focus:outline-none"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0">{error}</span>
          </div>
        )}

        <fieldset className="mb-4">
          <legend className={labelClass}>Type</legend>
          <div className="flex gap-2">
            {(["expense", "income"] as const).map((option) => (
              <label
                key={option}
                className={`flex-1 cursor-pointer touch-manipulation rounded-md border px-3 py-2 text-center font-body text-sm font-medium capitalize transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ledger ${
                  type === option
                    ? option === "income"
                      ? "border-ledger bg-ledger-soft text-ledger"
                      : "border-ink bg-paper-dim text-ink"
                    : "border-line text-ink-soft hover:bg-paper-dim"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={option}
                  checked={type === option}
                  onChange={() => setType(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="amount" className={labelClass}>
              Amount
            </label>
            <input
              ref={amountRef}
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              autoComplete="off"
              aria-invalid={!!fieldErrors.amount}
              aria-describedby={fieldErrors.amount ? "amount-error" : undefined}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className={`${inputClass} font-mono tabular-nums ${
                fieldErrors.amount ? invalidInputClass : ""
              }`}
            />
            {fieldErrors.amount && (
              <p id="amount-error" className={fieldErrorClass}>
                {fieldErrors.amount}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>
              Category
            </label>
            <input
              ref={categoryRef}
              id="category"
              name="category"
              type="text"
              list="category-suggestions"
              autoComplete="off"
              aria-invalid={!!fieldErrors.category}
              aria-describedby={
                fieldErrors.category ? "category-error" : undefined
              }
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Food…"
              className={`${inputClass} ${fieldErrors.category ? invalidInputClass : ""}`}
            />
            <datalist id="category-suggestions">
              {CATEGORIES.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            {fieldErrors.category && (
              <p id="category-error" className={fieldErrorClass}>
                {fieldErrors.category}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="date" className={labelClass}>
              Date
            </label>
            <input
              ref={dateRef}
              id="date"
              name="date"
              type="date"
              autoComplete="off"
              aria-invalid={!!fieldErrors.date}
              aria-describedby={fieldErrors.date ? "date-error" : undefined}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={`${inputClass} ${fieldErrors.date ? invalidInputClass : ""}`}
            />
            {fieldErrors.date && (
              <p id="date-error" className={fieldErrorClass}>
                {fieldErrors.date}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="description" className={labelClass}>
            Description{" "}
            <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input
            id="description"
            name="description"
            type="text"
            autoComplete="off"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClass}
          />
        </div>

        {type === "income" &&
          (goals.length > 0 ? (
            <div className="mt-4">
              <label htmlFor="goal" className={labelClass}>
                Add to a goal{" "}
                <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <select
                id="goal"
                name="goalId"
                autoComplete="off"
                value={goalId}
                onChange={(event) => setGoalId(event.target.value)}
                className={inputClass}
              >
                <option value="">Don&rsquo;t add to a goal</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mt-4 font-body text-xs text-ink-soft">
              <Link
                to="/goals"
                className="touch-manipulation rounded-sm font-medium text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Set a savings goal
              </Link>{" "}
              to earmark income toward it.
            </p>
          ))}

        {!isEditing && (
          <label className="mt-4 flex cursor-pointer touch-manipulation items-start gap-2 rounded-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ledger">
            <input
              type="checkbox"
              name="isRecurring"
              checked={isRecurring}
              onChange={(event) => setIsRecurring(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-ledger"
            />
            <span className="font-body text-sm text-ink">
              Repeats monthly
              <span className="block font-normal text-ink-soft">
                Automatically added again each month (e.g. rent, subscriptions)
              </span>
            </span>
          </label>
        )}

        {isEditing && editingTransaction.is_recurring && (
          <p className="mt-4 font-body text-xs text-ink-soft">
            Part of a monthly recurring series.
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex touch-manipulation items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,var(--color-button-start),var(--color-button-end))] px-4 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {loading
              ? isEditing
                ? "Saving…"
                : "Adding…"
              : isEditing
                ? "Save changes"
                : "Add transaction"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={loading}
              className="touch-manipulation rounded-md px-4 py-2.5 font-body text-sm font-medium text-ink-soft transition-colors hover:bg-paper-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default TransactionForm;
