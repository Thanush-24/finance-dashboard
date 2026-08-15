import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseDialogA11yOptions {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
  restoreFocusRef: RefObject<HTMLElement | null>;
}

// Escape-to-close and a Tab-key focus trap for a conditionally-rendered
// dialog/drawer, plus focus management: moves focus into the dialog on
// open and restores it to the trigger on close. Moves focus after the DOM
// actually reflects the open/closed state (relevant when a parent also
// marks background content `inert`) rather than inline in the event
// handler that triggers the state change, since focusing an element still
// marked inert is silently a no-op.
export function useDialogA11y({
  open,
  onClose,
  containerRef,
  initialFocusRef,
  restoreFocusRef,
}: UseDialogA11yOptions) {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      initialFocusRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      restoreFocusRef.current?.focus();
    }
  }, [open, initialFocusRef, restoreFocusRef]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !containerRef.current) return;

      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, containerRef]);
}
