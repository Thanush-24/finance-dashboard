import { useRef } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useDialogA11y } from "../hooks/useDialogA11y";

interface ConfirmDeleteDialogProps {
  description: string;
  deleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

function ConfirmDeleteDialog({
  description,
  deleting,
  error,
  onConfirm,
  onCancel,
  triggerRef,
}: ConfirmDeleteDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useDialogA11y({
    open: true,
    onClose: onCancel,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    restoreFocusRef: triggerRef,
  });

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
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-description"
        className="relative w-full max-w-sm rounded-lg border border-line border-t-2 border-t-rust bg-card p-5"
      >
        <h2
          id="confirm-delete-title"
          className="font-display text-base font-semibold text-ink"
        >
          Delete transaction?
        </h2>
        <p
          id="confirm-delete-description"
          className="mt-2 font-body text-sm text-ink-soft"
        >
          You&rsquo;re about to delete{" "}
          <span className="font-mono tabular-nums text-ink">{description}</span>
          . This can&rsquo;t be undone.
        </p>

        {error && (
          <div
            aria-live="polite"
            className="mt-4 flex items-start gap-2 rounded-md border border-rust/30 bg-rust/5 px-3 py-2 font-body text-sm text-rust"
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
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="touch-manipulation rounded-md px-4 py-2 font-body text-sm font-medium text-ink-soft transition-colors hover:bg-paper-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex touch-manipulation items-center gap-2 rounded-md bg-[#a8241f] px-4 py-2 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting && (
              <Loader2
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteDialog;
