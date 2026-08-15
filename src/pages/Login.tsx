import { Landmark } from "lucide-react";

function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Landmark className="h-6 w-6 text-ledger" aria-hidden="true" />
          <span className="font-display text-lg font-semibold text-ink">
            Ledger
          </span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">Log in</h1>
        <p className="mt-2 font-body text-ink-soft">Coming soon</p>
      </div>
    </div>
  );
}

export default Login;
