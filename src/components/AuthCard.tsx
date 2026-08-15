import type { ReactNode } from "react";
import { Landmark } from "lucide-react";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgba(255,122,69,0.35),rgba(196,41,60,0.18)_60%,transparent_75%)] blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Landmark className="h-6 w-6 text-accent" aria-hidden="true" />
          <span className="font-display text-lg font-semibold text-ink">
            Ledger
          </span>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-line bg-card px-6 py-8 shadow-[0_0_60px_-15px_rgba(255,90,60,0.35)]">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-deep))]"
          />
          <h1 className="font-display text-xl font-semibold text-ink">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthCard;
