import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2, Receipt } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useGoals } from "../hooks/useGoals";
import type { Transaction } from "../hooks/useTransactions";
import { CATEGORIES } from "../lib/categories";
import { todayISODate } from "../lib/formatters";
import { extractReceiptText, parseReceiptText } from "../lib/receiptOcr";
import { uploadReceipt, getReceiptSignedUrl } from "../lib/receiptStorage";

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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(
    null,
  );
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    };
  }, [receiptPreviewUrl]);

  useEffect(() => {
    if (isEditing) {
      formRef.current?.scrollIntoView({ block: "nearest" });
      amountRef.current?.focus();
    }
    // Only on mount: this component remounts fresh (via `key`) whenever
    // edit mode is entered or the edited row changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanError(null);
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    setReceiptFile(file);
    setReceiptPreviewUrl(URL.createObjectURL(file));

    setScanning(true);
    try {
      const text = await extractReceiptText(file);
      const parsed = parseReceiptText(text);
      if (parsed.amount !== null) setAmount(String(parsed.amount));
      if (parsed.date) setDate(parsed.date);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.description) setDescription(parsed.description);
    } catch (ocrError) {
      console.error("[transactions] receipt OCR failed:", ocrError);
      setScanError(
        "Couldn’t read the bill automatically — enter the details manually.",
      );
    } finally {
      setScanning(false);
    }
  }

  function handleClearReceipt() {
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    setReceiptFile(null);
    setReceiptPreviewUrl(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleViewReceipt() {
    if (!editingTransaction?.receipt_path) return;
    try {
      const url = await getReceiptSignedUrl(editingTransaction.receipt_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (viewError) {
      console.error("[transactions] failed to open receipt:", viewError);
    }
  }

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

    let receiptPath: string | null = null;
    if (receiptFile && !isEditing) {
      try {
        receiptPath = await uploadReceipt(receiptFile, session.user.id);
      } catch (uploadError) {
        console.error("[transactions] receipt upload failed:", uploadError);
        setLoading(false);
        setError("Couldn’t upload your receipt. Try again.");
        return;
      }
    }

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
          receipt_path: receiptPath,
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
    handleClearReceipt();
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

        {!isEditing && (
          <fieldset className="mt-4">
            <legend className={labelClass}>
              Bill <span className="font-normal text-ink-soft">(optional)</span>
            </legend>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                id="receipt-file"
                name="receiptFile"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="receipt-file"
                className="flex cursor-pointer touch-manipulation items-center gap-2 rounded-md border border-line px-3 py-2 font-body text-sm font-medium text-ink-soft transition-colors hover:bg-paper-dim hover:text-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ledger"
              >
                <Receipt className="h-4 w-4" aria-hidden="true" />
                {receiptFile ? "Replace bill" : "Upload a bill"}
              </label>

              {receiptPreviewUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={receiptPreviewUrl}
                    alt="Uploaded bill preview"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleClearReceipt}
                    className="touch-manipulation rounded-sm font-body text-xs font-medium text-ink-soft underline-offset-2 hover:text-rust hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {scanning && (
              <p
                aria-live="polite"
                className="mt-2 font-body text-xs text-ink-soft"
              >
                Reading bill…
              </p>
            )}
            {!scanning && receiptFile && !scanError && (
              <p
                aria-live="polite"
                className="mt-2 font-body text-xs text-ledger"
              >
                Filled in the amount, date, and category from your bill — check
                them before saving.
              </p>
            )}
            {scanError && (
              <p
                aria-live="polite"
                className="mt-2 font-body text-xs text-rust"
              >
                {scanError}
              </p>
            )}
          </fieldset>
        )}

        {isEditing && editingTransaction.receipt_path && (
          <p className="mt-4 font-body text-xs text-ink-soft">
            <button
              type="button"
              onClick={handleViewReceipt}
              className="inline-flex touch-manipulation items-center gap-1.5 rounded-sm font-medium text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
              View attached receipt
            </button>
          </p>
        )}

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
