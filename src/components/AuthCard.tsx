import type { ReactNode } from "react";
import { Landmark } from "lucide-react";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Landmark className="h-6 w-6 text-ledger" aria-hidden="true" />
          <span className="font-display text-lg font-semibold text-ink">
            Ledger
          </span>
        </div>
        <div className="rounded-lg border border-line border-t-2 border-t-ledger bg-white px-6 py-8 shadow-sm">
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
