import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Landmark,
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  LogOut,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
];

interface SidebarProps {
  onNavigate?: () => void;
}

function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    onNavigate?.();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-full flex-col border-r border-line bg-paper text-ink">
      <div className="flex items-center gap-2 px-6 py-6">
        <Landmark className="h-6 w-6 text-accent" aria-hidden="true" />
        <span className="font-display text-lg font-semibold tracking-tight">
          Ledger
        </span>
      </div>

      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 font-body text-sm font-medium transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger-light",
                    isActive
                      ? "border-ledger-light bg-white/5 text-white"
                      : "border-transparent text-ink-soft hover:border-white/20 hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full touch-manipulation items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm font-medium text-ink-soft transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? (
            <Loader2
              className="h-5 w-5 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <LogOut className="h-5 w-5" aria-hidden="true" />
          )}
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
