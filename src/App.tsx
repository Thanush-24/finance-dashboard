import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";

// TEMPORARY — verification only, remove once the Supabase connection is
// confirmed working. Queries a table that doesn't exist yet: a PostgREST
// "table not in schema cache" error (PGRST205) means we reached the right
// project with valid credentials (schema comes in phase 2b). Any other
// outcome means the URL, key, or network path is actually broken.
function useSupabaseConnectionCheck() {
  useEffect(() => {
    supabase
      .from("_connection_check_")
      .select("*")
      .limit(1)
      .then(({ error }) => {
        if (!error) {
          console.log(
            "[supabase] connection check succeeded (unexpected: table exists)",
          );
        } else if (error.code === "PGRST205" || error.code === "42P01") {
          console.log(
            "[supabase] connection check succeeded: reached project, no schema yet (expected)",
          );
        } else {
          console.error("[supabase] connection check failed:", error);
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
