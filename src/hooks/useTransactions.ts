import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: PostgrestError | null;
  refetch: () => void;
}

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const refetch = useCallback(() => {
    setRefetchToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          console.error("[transactions] fetch failed:", fetchError);
          setError(fetchError);
        } else {
          setError(null);
          setTransactions(data ?? []);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  return { transactions, loading, error, refetch };
}
