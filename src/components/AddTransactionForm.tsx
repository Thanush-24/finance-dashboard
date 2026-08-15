import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { Transaction } from "../hooks/useTransactions";

const CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Utilities",
  "Entertainment",
  "Salary",
  "Other",
] as const;

const inputClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2 font-body text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger";

const invalidInputClass = "border-rust/60";

const labelClass = "mb-1.5 block font-body text-sm font-medium text-ink";

const fieldErrorClass = "mt-1 font-body text-xs text-rust";

function todayISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

interface FieldErrors {
  amount?: string;
  category?: string;
  date?: string;
}

interface AddTransactionFormProps {
  onAdded: () => void;
}

function AddTransactionForm({ onAdded }: AddTransactionFormProps) {
  const { session } = useAuth();
  const [type, setType] = useState<Transaction["type"]>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISODate);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    const nextFieldErrors: FieldErrors = {};
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextFieldErrors.amount = "Enter an amount greater than 0.";
    }
    if (!category) {
      nextFieldErrors.category = "Select a category.";
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

    setLoading(true);
    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: session.user.id,
      amount: parsedAmount,
      category,
      type,
      description: description.trim() || null,
      date,
    });
    setLoading(false);

    if (insertError) {
      console.error("[transactions] insert failed:", insertError);
      setError("Couldn’t add this transaction. Try again.");
      return;
    }

    setType("expense");
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(todayISODate());
    setFieldErrors({});
    amountRef.current?.focus();

    onAdded();
  }

  return (
    <div className="rounded-lg border border-line border-t-2 border-t-ledger bg-white p-5">
      <h2 className="font-display text-base font-semibold text-ink">
        Add a transaction
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
            <select
              ref={categoryRef}
              id="category"
              name="category"
              autoComplete="off"
              aria-invalid={!!fieldErrors.category}
              aria-describedby={
                fieldErrors.category ? "category-error" : undefined
              }
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={`${inputClass} ${fieldErrors.category ? invalidInputClass : ""}`}
            >
              <option value="" disabled>
                Select a category
              </option>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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

        <button
          type="submit"
          disabled={loading}
          className="mt-5 flex w-full touch-manipulation items-center justify-center gap-2 rounded-md bg-ledger px-4 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-ledger/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading && (
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {loading ? "Adding…" : "Add transaction"}
        </button>
      </form>
    </div>
  );
}

export default AddTransactionForm;
