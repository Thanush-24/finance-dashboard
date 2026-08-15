import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: PostgrestError | null;
}

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          console.error("[transactions] fetch failed:", fetchError);
          setError(fetchError);
        } else {
          setTransactions(data ?? []);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { transactions, loading, error };
}
