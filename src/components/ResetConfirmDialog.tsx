import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useDialogA11y } from "../hooks/useDialogA11y";

const CONFIRM_WORD = "RESET";

interface ResetConfirmDialogProps {
  title: string;
  description: string;
  resetting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

function ResetConfirmDialog({
  title,
  description,
  resetting,
  error,
  onConfirm,
  onCancel,
  triggerRef,
}: ResetConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  useDialogA11y({
    open: true,
    onClose: onCancel,
    containerRef: dialogRef,
    initialFocusRef: inputRef,
    restoreFocusRef: triggerRef,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isConfirmed && !resetting) onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-confirm-title"
        aria-describedby="reset-confirm-description"
        className="relative w-full max-w-sm rounded-lg border border-line border-t-2 border-t-rust bg-card p-5"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-rust"
            aria-hidden="true"
          />
          <h2
            id="reset-confirm-title"
            className="font-display text-base font-semibold text-ink"
          >
            {title}
          </h2>
        </div>
        <p
          id="reset-confirm-description"
          className="mt-2 font-body text-sm text-ink-soft"
        >
          {description} This can&rsquo;t be undone.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4">
          <label
            htmlFor="reset-confirm-input"
            className="mb-1.5 block font-body text-sm font-medium text-ink"
          >
            Type <span className="font-mono text-rust">RESET</span> to confirm
          </label>
          <input
            ref={inputRef}
            id="reset-confirm-input"
            name="confirmReset"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            className="w-full rounded-md border border-input-border bg-input-bg px-3 py-2 font-mono text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust"
          />

          {error && (
            <div
              aria-live="polite"
              className="mt-3 flex items-start gap-2 rounded-md border border-rust/30 bg-rust/10 px-3 py-2 font-body text-sm text-rust"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span className="min-w-0">{error}</span>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={resetting}
              className="touch-manipulation rounded-md px-4 py-2 font-body text-sm font-medium text-ink-soft transition-colors hover:bg-paper-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || resetting}
              className="flex touch-manipulation items-center gap-2 rounded-md bg-[#a8241f] px-4 py-2 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetting && (
                <Loader2
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {resetting ? "Resetting…" : "Reset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetConfirmDialog;
