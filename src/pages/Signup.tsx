import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import AuthCard from "../components/AuthCard";

const inputClass =
  "w-full rounded-md border border-fintech-input-border bg-fintech-input-bg px-3 py-2 font-body text-sm text-fintech-text placeholder:text-fintech-text-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fintech-accent";

const invalidInputClass = "border-fintech-error/60";

const labelClass =
  "mb-1.5 block font-body text-sm font-medium text-fintech-text";

const fieldErrorClass = "mt-1 font-body text-xs text-fintech-error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
    else if (info) infoRef.current?.focus();
  }, [error, info]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const nextFieldErrors: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email)) {
      nextFieldErrors.email = "Enter a valid email address.";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextFieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirmPassword) {
      nextFieldErrors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.email) {
      emailRef.current?.focus();
      return;
    }
    if (nextFieldErrors.password) {
      passwordRef.current?.focus();
      return;
    }
    if (nextFieldErrors.confirmPassword) {
      confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setInfo("Check your email to confirm your account before logging in.");
      return;
    }

    navigate("/dashboard", { replace: true });
  }

  return (
    <AuthCard title="Sign up">
      <form onSubmit={handleSubmit} noValidate className="mt-6">
        {error && (
          <div
            ref={errorRef}
            aria-live="polite"
            tabIndex={-1}
            className="mb-4 flex items-start gap-2 rounded-md border border-fintech-error/30 bg-fintech-error/10 px-3 py-2 font-body text-sm text-fintech-error focus:outline-none"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0">{error}</span>
          </div>
        )}

        {info && (
          <div
            ref={infoRef}
            role="status"
            tabIndex={-1}
            className="mb-4 flex items-start gap-2 rounded-md border border-fintech-success/30 bg-fintech-success/10 px-3 py-2 font-body text-sm text-fintech-success focus:outline-none"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0">{info}</span>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${inputClass} ${fieldErrors.email ? invalidInputClass : ""}`}
          />
          {fieldErrors.email && (
            <p id="email-error" className={fieldErrorClass}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? "password-error" : undefined
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${inputClass} ${fieldErrors.password ? invalidInputClass : ""}`}
          />
          {fieldErrors.password && (
            <p id="password-error" className={fieldErrorClass}>
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="confirm-password" className={labelClass}>
            Confirm password
          </label>
          <input
            ref={confirmPasswordRef}
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={!!fieldErrors.confirmPassword}
            aria-describedby={
              fieldErrors.confirmPassword ? "confirm-password-error" : undefined
            }
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={`${inputClass} ${fieldErrors.confirmPassword ? invalidInputClass : ""}`}
          />
          {fieldErrors.confirmPassword && (
            <p id="confirm-password-error" className={fieldErrorClass}>
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full touch-manipulation items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,var(--color-fintech-button-start),var(--color-fintech-button-end))] px-4 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fintech-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-fintech-text-soft">
        Already have an account?{" "}
        <Link
          to="/login"
          className="touch-manipulation rounded-sm font-medium text-fintech-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fintech-accent"
        >
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}

export default Signup;
