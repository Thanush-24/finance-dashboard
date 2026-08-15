import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Moves focus after the DOM actually reflects the open/closed state (in
  // particular after `inert` is cleared from the header on close) rather
  // than inline in the event handler that triggers the state change, since
  // focusing an element still marked inert is silently a no-op.
  useEffect(() => {
    if (mobileNavOpen) {
      wasOpenRef.current = true;
      closeButtonRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      menuButtonRef.current?.focus();
    }
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
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
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-paper md:flex">
      <div className="hidden md:block md:w-64 md:shrink-0">
        <div className="fixed h-screen w-64">
          <Sidebar />
        </div>
      </div>

      <header
        inert={mobileNavOpen || undefined}
        className="flex items-center justify-between border-b border-line bg-ink px-4 py-3 md:hidden"
      >
        <span className="font-display text-base font-semibold text-paper">
          Ledger
        </span>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileNavOpen}
          className="rounded-md p-2 text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger-light"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/60"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="relative h-full w-72 max-w-[80vw]"
          >
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-3 rounded-md p-2 text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger-light"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <main
        inert={mobileNavOpen || undefined}
        className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-10"
      >
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
