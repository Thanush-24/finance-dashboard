import { supabase } from "./supabase";
import type { Transaction } from "../hooks/useTransactions";
import {
  currentMonthKey,
  monthKeyOffset,
  type MonthKey,
} from "./dashboardAnalytics";

function dateToMonthKey(date: string): MonthKey {
  const [year, month] = date.split("-").map(Number);
  return { year, month: month - 1 };
}

function monthKeyToDate(key: MonthKey, day: number): string {
  const lastDay = new Date(key.year, key.month + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDay);
  const d = new Date(key.year, key.month, clampedDay);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function monthKeyCompare(a: MonthKey, b: MonthKey): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

// A recurring "template" is a transaction with is_recurring = true and no
// parent (recurring_parent_id is null). Each auto-generated monthly copy
// points back to it via recurring_parent_id. There's no server-side cron
// in this stack, so instead of a background job, this runs on load: for
// every template, find the latest logged instance (the template itself or
// one of its children) and insert one row for every month between that
// and the current month — backfilling however many months were missed if
// the user hasn't opened the app in a while.
export async function backfillRecurringTransactions(
  transactions: Transaction[],
  userId: string,
): Promise<boolean> {
  const templates = transactions.filter(
    (t) => t.is_recurring && t.recurring_parent_id === null,
  );
  if (templates.length === 0) return false;

  const current = currentMonthKey();
  const rowsToInsert: Array<{
    user_id: string;
    amount: number;
    category: string;
    type: "income" | "expense";
    description: string | null;
    date: string;
    is_recurring: boolean;
    recurring_parent_id: string;
  }> = [];

  for (const template of templates) {
    const instances = transactions.filter(
      (t) => t.recurring_parent_id === template.id,
    );
    const latestDate = [template, ...instances].reduce(
      (latest, t) => (t.date > latest ? t.date : latest),
      template.date,
    );
    const templateDay = Number(template.date.split("-")[2]);

    let cursor = monthKeyOffset(dateToMonthKey(latestDate), 1);
    while (monthKeyCompare(cursor, current) <= 0) {
      rowsToInsert.push({
        user_id: userId,
        amount: template.amount,
        category: template.category,
        type: template.type,
        description: template.description,
        date: monthKeyToDate(cursor, templateDay),
        is_recurring: true,
        recurring_parent_id: template.id,
      });
      cursor = monthKeyOffset(cursor, 1);
    }
  }

  if (rowsToInsert.length === 0) return false;

  const { error } = await supabase.from("transactions").insert(rowsToInsert);
  if (error) {
    console.error("[recurring] backfill insert failed:", error);
    return false;
  }
  return true;
}
