import type { Transaction } from "../hooks/useTransactions";
import { amountFormatter, monthLabelFormatter } from "./formatters";

export interface MonthKey {
  year: number;
  month: number; // 0-11
}

export function currentMonthKey(): MonthKey {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function monthKeyOffset(key: MonthKey, offset: number): MonthKey {
  const d = new Date(key.year, key.month + offset, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function transactionMonthKey(transaction: Transaction): MonthKey {
  const [year, month] = transaction.date.split("-").map(Number);
  return { year, month: month - 1 };
}

function isInMonth(transaction: Transaction, key: MonthKey): boolean {
  const tk = transactionMonthKey(transaction);
  return tk.year === key.year && tk.month === key.month;
}

export function filterByMonth(
  transactions: Transaction[],
  key: MonthKey,
): Transaction[] {
  return transactions.filter((t) => isInMonth(t, key));
}

export function sumByType(
  transactions: Transaction[],
  type: Transaction["type"],
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export function groupExpensesByCategory(
  transactions: Transaction[],
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface MonthSeriesPoint {
  key: MonthKey;
  label: string;
  income: number;
  expenses: number;
}

export function getLastNMonthsSeries(
  transactions: Transaction[],
  n: number,
): MonthSeriesPoint[] {
  const current = currentMonthKey();
  const points: MonthSeriesPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const key = monthKeyOffset(current, -i);
    const monthTransactions = filterByMonth(transactions, key);
    points.push({
      key,
      label: monthLabelFormatter.format(new Date(key.year, key.month, 1)),
      income: sumByType(monthTransactions, "income"),
      expenses: sumByType(monthTransactions, "expense"),
    });
  }
  return points;
}

export interface CategoryTrendPoint {
  label: string;
  [category: string]: number | string;
}

export interface CategoryTrendSeries {
  points: CategoryTrendPoint[];
  categories: string[];
}

export function getCategoryTrendSeries(
  transactions: Transaction[],
  n: number,
): CategoryTrendSeries {
  const current = currentMonthKey();
  const points: CategoryTrendPoint[] = [];
  const categorySet = new Set<string>();

  for (let i = n - 1; i >= 0; i--) {
    const key = monthKeyOffset(current, -i);
    const monthTransactions = filterByMonth(transactions, key);
    const point: CategoryTrendPoint = {
      label: monthLabelFormatter.format(new Date(key.year, key.month, 1)),
    };
    for (const { category, total } of groupExpensesByCategory(
      monthTransactions,
    )) {
      point[category] = total;
      categorySet.add(category);
    }
    points.push(point);
  }

  return { points, categories: Array.from(categorySet).sort() };
}

function daysInMonth(key: MonthKey): number {
  return new Date(key.year, key.month + 1, 0).getDate();
}

export interface Insight {
  id: string;
  text: string;
}

export function computeInsights(transactions: Transaction[]): Insight[] {
  const insights: Insight[] = [];
  const current = currentMonthKey();
  const previous = monthKeyOffset(current, -1);

  const currentMonthTx = filterByMonth(transactions, current);
  const previousMonthTx = filterByMonth(transactions, previous);

  const currentByCategory = groupExpensesByCategory(currentMonthTx);
  const previousByCategory = groupExpensesByCategory(previousMonthTx);
  const previousTotalsByCategory = new Map(
    previousByCategory.map((c) => [c.category, c.total]),
  );

  let biggestIncrease: { category: string; percent: number } | null = null;
  for (const { category, total } of currentByCategory) {
    const prevTotal = previousTotalsByCategory.get(category);
    if (!prevTotal || prevTotal <= 0) continue;
    const percent = ((total - prevTotal) / prevTotal) * 100;
    if (
      percent > 0 &&
      (!biggestIncrease || percent > biggestIncrease.percent)
    ) {
      biggestIncrease = { category, percent };
    }
  }
  if (biggestIncrease) {
    insights.push({
      id: "category-increase",
      text: `You spent ${Math.round(biggestIncrease.percent)}% more on ${biggestIncrease.category} this month than last month.`,
    });
  }

  const today = new Date();
  const isCurrentRealMonth =
    current.year === today.getFullYear() && current.month === today.getMonth();
  if (isCurrentRealMonth && currentMonthTx.length > 0) {
    const daysElapsed = today.getDate();
    const totalDays = daysInMonth(current);
    const netSoFar =
      sumByType(currentMonthTx, "income") -
      sumByType(currentMonthTx, "expense");
    const projected = (netSoFar / daysElapsed) * totalDays;
    insights.push({
      id: "savings-pace",
      text:
        projected >= 0
          ? `You’re on track to save ${amountFormatter.format(projected)} this month.`
          : `At this pace, you’re on track to end the month ${amountFormatter.format(Math.abs(projected))} short.`,
    });
  }

  if (currentByCategory.length > 0) {
    const top = currentByCategory[0];
    const totalExpenses = sumByType(currentMonthTx, "expense");
    const share =
      totalExpenses > 0 ? Math.round((top.total / totalExpenses) * 100) : 0;
    insights.push({
      id: "top-category",
      text: `${top.category} is your biggest expense this month at ${amountFormatter.format(top.total)} (${share}% of spending).`,
    });
  }

  return insights.slice(0, 3);
}
