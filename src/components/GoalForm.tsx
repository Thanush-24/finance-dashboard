import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { Goal } from "../hooks/useGoals";
import { todayISODate } from "../lib/formatters";

const inputClass =
  "w-full rounded-md border border-input-border bg-input-bg px-3 py-2 font-body text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger";

const invalidInputClass = "border-rust/60";

const labelClass = "mb-1.5 block font-body text-sm font-medium text-ink";

const fieldErrorClass = "mt-1 font-body text-xs text-rust";

interface FieldErrors {
  name?: string;
  targetAmount?: string;
  targetDate?: string;
}

interface GoalFormProps {
  editingGoal: Goal | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}

// Mounts fresh on every switch between create mode and editing a specific
// goal (parent renders with key={editingGoal?.id ?? "new"}), so local
// state can just initialize from the prop instead of syncing via an effect.
function GoalForm({ editingGoal, onSaved, onCancelEdit }: GoalFormProps) {
  const isEditing = editingGoal !== null;
  const { session } = useAuth();
  const [name, setName] = useState(editingGoal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    editingGoal ? String(editingGoal.target_amount) : "",
  );
  const [targetDate, setTargetDate] = useState(editingGoal?.target_date ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const targetAmountRef = useRef<HTMLInputElement>(null);
  const targetDateRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (isEditing) {
      formRef.current?.scrollIntoView({ block: "nearest" });
      nameRef.current?.focus();
    }
    // Only on mount: this component remounts fresh (via `key`) whenever
    // edit mode is entered or the edited goal changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(targetAmount);
    const nextFieldErrors: FieldErrors = {};
    if (!name.trim()) {
      nextFieldErrors.name = "Enter a name for this goal.";
    }
    if (!targetAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextFieldErrors.targetAmount = "Enter an amount greater than 0.";
    }
    if (!targetDate) {
      nextFieldErrors.targetDate = "Select a target date.";
    } else if (targetDate < todayISODate()) {
      nextFieldErrors.targetDate = "Target date must be in the future.";
    }
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextFieldErrors.targetAmount) {
      targetAmountRef.current?.focus();
      return;
    }
    if (nextFieldErrors.targetDate) {
      targetDateRef.current?.focus();
      return;
    }

    if (!session) return;

    const payload = {
      name: name.trim(),
      target_amount: parsedAmount,
      target_date: targetDate,
    };

    setLoading(true);
    const { error: saveError } = isEditing
      ? await supabase.from("goals").update(payload).eq("id", editingGoal.id)
      : await supabase
          .from("goals")
          .insert({ ...payload, user_id: session.user.id });
    setLoading(false);

    if (saveError) {
      console.error(
        `[goals] ${isEditing ? "update" : "insert"} failed:`,
        saveError,
      );
      setError(
        isEditing
          ? "Couldn’t save these changes. Try again."
          : "Couldn’t add this goal. Try again.",
      );
      return;
    }

    if (isEditing) {
      onSaved();
      return;
    }

    setName("");
    setTargetAmount("");
    setTargetDate("");
    setFieldErrors({});
    nameRef.current?.focus();

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
        {isEditing ? "Edit goal" : "Set a savings goal"}
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        {error && (
          <div
            ref={errorRef}
            aria-live="polite"
            tabIndex={-1}
            className="mb-4 flex items-start gap-2 rounded-md border border-rust/30 bg-rust/10 px-3 py-2 font-body text-sm text-rust focus:outline-none"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="goal-name" className={labelClass}>
              Goal name
            </label>
            <input
              ref={nameRef}
              id="goal-name"
              name="name"
              type="text"
              autoComplete="off"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={
                fieldErrors.name ? "goal-name-error" : undefined
              }
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New laptop…"
              className={`${inputClass} ${fieldErrors.name ? invalidInputClass : ""}`}
            />
            {fieldErrors.name && (
              <p id="goal-name-error" className={fieldErrorClass}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="target-amount" className={labelClass}>
              Target amount
            </label>
            <input
              ref={targetAmountRef}
              id="target-amount"
              name="targetAmount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              autoComplete="off"
              aria-invalid={!!fieldErrors.targetAmount}
              aria-describedby={
                fieldErrors.targetAmount ? "target-amount-error" : undefined
              }
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              placeholder="0.00"
              className={`${inputClass} font-mono tabular-nums ${
                fieldErrors.targetAmount ? invalidInputClass : ""
              }`}
            />
            {fieldErrors.targetAmount && (
              <p id="target-amount-error" className={fieldErrorClass}>
                {fieldErrors.targetAmount}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="target-date" className={labelClass}>
              Target date
            </label>
            <input
              ref={targetDateRef}
              id="target-date"
              name="targetDate"
              type="date"
              autoComplete="off"
              min={todayISODate()}
              aria-invalid={!!fieldErrors.targetDate}
              aria-describedby={
                fieldErrors.targetDate ? "target-date-error" : undefined
              }
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className={`${inputClass} ${fieldErrors.targetDate ? invalidInputClass : ""}`}
            />
            {fieldErrors.targetDate && (
              <p id="target-date-error" className={fieldErrorClass}>
                {fieldErrors.targetDate}
              </p>
            )}
          </div>
        </div>

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
                : "Setting…"
              : isEditing
                ? "Save changes"
                : "Set goal"}
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

export default GoalForm;
