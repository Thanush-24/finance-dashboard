import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";

// TEMPORARY — verification only, remove once auth lands in phase 2c.
// Queries the real transactions table with no session: RLS is scoped
// `to authenticated`, so an anon request matches zero policies and gets
// back an empty array (not an error) rather than every user's rows. An
// actual error here means the schema, RLS, or credentials are broken.
function useSupabaseConnectionCheck() {
  useEffect(() => {
    supabase
      .from("transactions")
      .select("*")
      .then(({ data, error }) => {
        if (error) {
          console.error("[supabase] connection check failed:", error);
        } else {
          console.log(
            "[supabase] connection check succeeded, RLS-empty as expected:",
            data,
          );
        }
      });
  }, []);
}

function App() {
  useSupabaseConnectionCheck();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
