import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { Budget } from "../hooks/useBudgets";
import { CATEGORIES } from "../lib/categories";

const inputClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2 font-body text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger";

const invalidInputClass = "border-rust/60";

const labelClass = "mb-1.5 block font-body text-sm font-medium text-ink";

const fieldErrorClass = "mt-1 font-body text-xs text-rust";

interface FieldErrors {
  category?: string;
  monthlyLimit?: string;
}

interface BudgetFormProps {
  editingBudget: Budget | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}

// Mounts fresh on every switch between create mode and editing a specific
// budget (parent renders with key={editingBudget?.id ?? "new"}), so local
// state can just initialize from the prop instead of syncing via an effect.
function BudgetForm({ editingBudget, onSaved, onCancelEdit }: BudgetFormProps) {
  const isEditing = editingBudget !== null;
  const { session } = useAuth();
  const [category, setCategory] = useState(editingBudget?.category ?? "");
  const [monthlyLimit, setMonthlyLimit] = useState(
    editingBudget ? String(editingBudget.monthly_limit) : "",
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const monthlyLimitRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (isEditing) {
      formRef.current?.scrollIntoView({ block: "nearest" });
      monthlyLimitRef.current?.focus();
    }
    // Only on mount: this component remounts fresh (via `key`) whenever
    // edit mode is entered or the edited budget changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedLimit = Number(monthlyLimit);
    const nextFieldErrors: FieldErrors = {};
    if (!category) {
      nextFieldErrors.category = "Select a category.";
    }
    if (!monthlyLimit || Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      nextFieldErrors.monthlyLimit = "Enter a limit greater than 0.";
    }
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.category) {
      categoryRef.current?.focus();
      return;
    }
    if (nextFieldErrors.monthlyLimit) {
      monthlyLimitRef.current?.focus();
      return;
    }

    if (!session) return;

    setLoading(true);
    const { error: saveError } = await supabase.from("budgets").upsert(
      {
        user_id: session.user.id,
        category,
        monthly_limit: parsedLimit,
      },
      { onConflict: "user_id,category" },
    );
    setLoading(false);

    if (saveError) {
      console.error("[budgets] upsert failed:", saveError);
      setError("Couldn’t save this budget. Try again.");
      return;
    }

    if (isEditing) {
      onSaved();
      return;
    }

    setCategory("");
    setMonthlyLimit("");
    setFieldErrors({});
    categoryRef.current?.focus();

    onSaved();
  }

  return (
    <div
      ref={formRef}
      className={`rounded-lg border border-line border-t-2 bg-white p-5 ${
        isEditing ? "border-t-ledger-light" : "border-t-ledger"
      }`}
    >
      <h2 className="font-display text-base font-semibold text-ink">
        {isEditing ? "Edit budget" : "Set a budget"}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="budget-category" className={labelClass}>
              Category
            </label>
            <select
              ref={categoryRef}
              id="budget-category"
              name="category"
              autoComplete="off"
              disabled={isEditing}
              aria-invalid={!!fieldErrors.category}
              aria-describedby={
                fieldErrors.category ? "budget-category-error" : undefined
              }
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={`${inputClass} ${fieldErrors.category ? invalidInputClass : ""} ${
                isEditing ? "cursor-not-allowed opacity-70" : ""
              }`}
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
              <p id="budget-category-error" className={fieldErrorClass}>
                {fieldErrors.category}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="monthly-limit" className={labelClass}>
              Monthly limit
            </label>
            <input
              ref={monthlyLimitRef}
              id="monthly-limit"
              name="monthlyLimit"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              autoComplete="off"
              aria-invalid={!!fieldErrors.monthlyLimit}
              aria-describedby={
                fieldErrors.monthlyLimit ? "monthly-limit-error" : undefined
              }
              value={monthlyLimit}
              onChange={(event) => setMonthlyLimit(event.target.value)}
              placeholder="0.00"
              className={`${inputClass} font-mono tabular-nums ${
                fieldErrors.monthlyLimit ? invalidInputClass : ""
              }`}
            />
            {fieldErrors.monthlyLimit && (
              <p id="monthly-limit-error" className={fieldErrorClass}>
                {fieldErrors.monthlyLimit}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex touch-manipulation items-center justify-center gap-2 rounded-md bg-ledger px-4 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-ledger/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger disabled:cursor-not-allowed disabled:opacity-60"
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
                : "Setting…"
              : isEditing
                ? "Save changes"
                : "Set budget"}
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

export default BudgetForm;
