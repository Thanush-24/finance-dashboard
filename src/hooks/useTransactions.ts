import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";
import { useAuth } from "./useAuth";
import { backfillRecurringTransactions } from "../lib/recurringTransactions";

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: PostgrestError | null;
  refetch: () => void;
}

export function useTransactions(): UseTransactionsResult {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const refetch = useCallback(() => {
    setRefetchToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        console.error("[transactions] fetch failed:", fetchError);
        setError(fetchError);
        setLoading(false);
        return;
      }

      let rows = data ?? [];

      if (userId) {
        const inserted = await backfillRecurringTransactions(rows, userId);
        if (inserted && !cancelled) {
          const { data: refreshed, error: refetchError } = await supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false })
            .order("created_at", { ascending: false });
          if (!refetchError && refreshed) rows = refreshed;
        }
      }

      if (cancelled) return;
      setError(null);
      setTransactions(rows);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [refetchToken, userId]);

  return { transactions, loading, error, refetch };
}
