import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import AuthCard from "../components/AuthCard";

const inputClass =
  "w-full rounded-md border border-input-border bg-input-bg px-3 py-2 font-body text-sm text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const labelClass = "mb-1.5 block font-body text-sm font-medium text-ink";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    navigate("/dashboard", { replace: true });
  }

  return (
    <AuthCard title="Log in">
      <form onSubmit={handleSubmit} noValidate className="mt-6">
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

        <div className="mb-4">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full touch-manipulation items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,var(--color-button-start),var(--color-button-end))] px-4 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-ink-soft">
        Don&rsquo;t have an account?{" "}
        <Link
          to="/signup"
          className="touch-manipulation rounded-sm font-medium text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

export default Login;
