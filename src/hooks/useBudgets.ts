import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type Budget = Database["public"]["Tables"]["budgets"]["Row"];

interface UseBudgetsResult {
  budgets: Budget[];
  loading: boolean;
  error: PostgrestError | null;
  refetch: () => void;
}

export function useBudgets(): UseBudgetsResult {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const refetch = useCallback(() => {
    setRefetchToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("budgets")
      .select("*")
      .order("category", { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          console.error("[budgets] fetch failed:", fetchError);
          setError(fetchError);
        } else {
          setError(null);
          setBudgets(data ?? []);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  return { budgets, loading, error, refetch };
}
