import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type Goal = Database["public"]["Tables"]["goals"]["Row"];

interface UseGoalsResult {
  goals: Goal[];
  loading: boolean;
  error: PostgrestError | null;
  refetch: () => void;
}

export function useGoals(): UseGoalsResult {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const refetch = useCallback(() => {
    setRefetchToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("goals")
      .select("*")
      .order("target_date", { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          console.error("[goals] fetch failed:", fetchError);
          setError(fetchError);
        } else {
          setError(null);
          setGoals(data ?? []);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  return { goals, loading, error, refetch };
}
