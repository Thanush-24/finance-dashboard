import { NavLink } from "react-router-dom";
import {
  Landmark,
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
];

interface SidebarProps {
  onNavigate?: () => void;
}

function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-ink text-paper">
      <div className="flex items-center gap-2 px-6 py-6">
        <Landmark className="h-6 w-6 text-ledger" aria-hidden="true" />
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
                      : "border-transparent text-paper/70 hover:border-white/20 hover:bg-white/5 hover:text-white",
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
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm font-medium text-paper/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger-light"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Log out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
