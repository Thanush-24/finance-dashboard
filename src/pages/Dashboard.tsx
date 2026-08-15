import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useTransactions } from "../hooks/useTransactions";
import {
  currentMonthKey,
  filterByMonth,
  sumByType,
  groupExpensesByCategory,
  getLastNMonthsSeries,
  computeInsights,
  type CategoryTotal,
  type MonthSeriesPoint,
  type Insight,
} from "../lib/dashboardAnalytics";
import { amountFormatter, compactAmountFormatter } from "../lib/formatters";
import ChartPatternDefs from "../components/ChartPatternDefs";
import { getCategoryStyle } from "../lib/chartCategoryStyles";

function DashboardSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-paper-dim" />
        <div className="h-8 w-44 rounded-md bg-paper-dim" />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div key={card} className="rounded-lg border border-line bg-card p-5">
            <div className="h-3 w-24 rounded bg-paper-dim" />
            <div className="mt-3 h-7 w-32 rounded bg-paper-dim" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-lg border border-line bg-card p-5">
          <div className="h-3 w-40 rounded bg-paper-dim" />
        </div>
        <div className="h-80 rounded-lg border border-line bg-card p-5">
          <div className="h-3 w-40 rounded bg-paper-dim" />
        </div>
      </div>
    </div>
  );
}

function DashboardEmptyState() {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-line px-6 py-16 text-center">
      <p className="font-body text-base font-medium text-ink">
        No transactions yet.
      </p>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Add your first transaction to see your spending come to life here.
      </p>
      <Link
        to="/transactions"
        className="mt-5 inline-flex touch-manipulation items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--color-button-start),var(--color-button-end))] px-4 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Add a transaction
      </Link>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  amount: number;
  tone: "income" | "expense" | "positive" | "negative";
  caption?: string;
}

const SUMMARY_TONE_CLASS: Record<SummaryCardProps["tone"], string> = {
  income: "text-ledger",
  expense: "text-ink",
  positive: "text-ledger",
  negative: "text-rust",
};

function SummaryCard({ label, amount, tone, caption }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
        {label}
      </p>
      <p
        className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${SUMMARY_TONE_CLASS[tone]}`}
      >
        {amountFormatter.format(amount)}
      </p>
      {caption && (
        <p
          className={`mt-1 font-body text-xs ${tone === "negative" ? "text-rust" : "text-ink-soft"}`}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

type SummaryPeriod = "month" | "all";

const PERIOD_OPTIONS: { value: SummaryPeriod; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

function PeriodToggle({
  value,
  onChange,
}: {
  value: SummaryPeriod;
  onChange: (value: SummaryPeriod) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Summary period"
      className="inline-flex rounded-md border border-line bg-paper-dim p-1"
    >
      {PERIOD_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`touch-manipulation rounded px-3 py-1.5 font-body text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger ${
              active
                ? "bg-card text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PieSliceLabel({
  category,
  percent,
}: {
  category?: string;
  percent?: number;
}) {
  if (!category || percent === undefined) return null;
  return `${category} ${Math.round(percent * 100)}%`;
}

function ExpensePieChart({ data }: { data: CategoryTotal[] }) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <h2 className="font-display text-base font-semibold text-ink">
        Expenses by category
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">This month</p>

      <ChartPatternDefs />

      {data.length === 0 ? (
        <p className="mt-6 py-14 text-center font-body text-sm text-ink-soft">
          No expenses recorded this month yet.
        </p>
      ) : (
        <div className="mt-2 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={85}
                stroke="var(--color-card)"
                strokeWidth={2}
                isAnimationActive={false}
                label={PieSliceLabel}
                labelLine
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={`url(#${getCategoryStyle(index).patternId})`}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  amountFormatter.format(
                    typeof value === "number" ? value : Number(value),
                  )
                }
                contentStyle={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-line)",
                  color: "var(--color-ink)",
                }}
                labelStyle={{ color: "var(--color-ink)" }}
                itemStyle={{
                  fontFamily: "var(--font-mono)",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--color-ink)",
                }}
              />
              <Legend
                formatter={(value: string) => (
                  <span className="font-body text-sm text-ink">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function SquareDot({ cx, cy }: { cx?: number; cy?: number }) {
  if (cx === undefined || cy === undefined) return null;
  const size = 6;
  return (
    <rect
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      fill="var(--color-ink)"
    />
  );
}

function TrendLineChart({ data }: { data: MonthSeriesPoint[] }) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <h2 className="font-display text-base font-semibold text-ink">
        Income vs. expenses
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">Last 6 months</p>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              stroke="var(--color-line)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{
                fill: "var(--color-ink-soft)",
                fontSize: 12,
                fontFamily: "var(--font-body)",
              }}
              axisLine={{ stroke: "var(--color-line)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value: number) =>
                compactAmountFormatter.format(value)
              }
              tick={{
                fill: "var(--color-ink-soft)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              formatter={(value) =>
                amountFormatter.format(
                  typeof value === "number" ? value : Number(value),
                )
              }
              contentStyle={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-line)",
                color: "var(--color-ink)",
              }}
              labelStyle={{ color: "var(--color-ink)" }}
              itemStyle={{
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                color: "var(--color-ink)",
              }}
            />
            <Legend
              formatter={(value: string) => (
                <span className="font-body text-sm text-ink">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="var(--color-ledger)"
              strokeWidth={2}
              isAnimationActive={false}
              dot={{ r: 3, fill: "var(--color-ledger)" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="var(--color-ink)"
              strokeWidth={2}
              strokeDasharray="6 3"
              isAnimationActive={false}
              dot={<SquareDot />}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InsightsSection({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-line border-t-2 border-t-ledger-light bg-card p-5">
      <h2 className="font-display text-base font-semibold text-ink">
        Insights
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className="flex items-start gap-2 font-body text-sm text-ink"
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ledger-light"
              aria-hidden="true"
            />
            <span>{insight.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dashboard() {
  const { transactions, loading, error } = useTransactions();
  const [searchParams, setSearchParams] = useSearchParams();
  const summaryPeriod: SummaryPeriod =
    searchParams.get("summary") === "all" ? "all" : "month";
  function setSummaryPeriod(period: SummaryPeriod) {
    setSearchParams(
      (params) => {
        if (period === "month") {
          params.delete("summary");
        } else {
          params.set("summary", period);
        }
        return params;
      },
      { replace: true },
    );
  }

  const currentMonthTransactions = useMemo(
    () => filterByMonth(transactions, currentMonthKey()),
    [transactions],
  );
  const summaryTransactions =
    summaryPeriod === "month" ? currentMonthTransactions : transactions;
  const totalIncome = useMemo(
    () => sumByType(summaryTransactions, "income"),
    [summaryTransactions],
  );
  const totalExpenses = useMemo(
    () => sumByType(summaryTransactions, "expense"),
    [summaryTransactions],
  );
  const balance = totalIncome - totalExpenses;
  const balanceCaption =
    balance > 0
      ? "You’re saving"
      : balance < 0
        ? "Spending more than you earn"
        : "Breaking even";
  const categoryTotals = useMemo(
    () => groupExpensesByCategory(currentMonthTransactions),
    [currentMonthTransactions],
  );
  const monthSeries = useMemo(
    () => getLastNMonthsSeries(transactions, 6),
    [transactions],
  );
  const insights = useMemo(() => computeInsights(transactions), [transactions]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Dashboard
      </h1>

      {error && (
        <div
          aria-live="polite"
          className="mt-6 flex items-start gap-2 rounded-md border border-rust/30 bg-rust/5 px-3 py-2 font-body text-sm text-rust"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            Couldn&rsquo;t load your data. Try refreshing the page.
          </span>
        </div>
      )}

      {!error && loading && (
        <div className="mt-6">
          <DashboardSkeleton />
        </div>
      )}

      {!error && !loading && transactions.length === 0 && (
        <DashboardEmptyState />
      )}

      {!error && !loading && transactions.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-ink">
              Summary
            </h2>
            <PeriodToggle value={summaryPeriod} onChange={setSummaryPeriod} />
          </div>

          <div
            aria-live="polite"
            className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <SummaryCard label="Income" amount={totalIncome} tone="income" />
            <SummaryCard
              label="Expenses"
              amount={totalExpenses}
              tone="expense"
            />
            <SummaryCard
              label="Balance"
              amount={balance}
              tone={balance >= 0 ? "positive" : "negative"}
              caption={balanceCaption}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ExpensePieChart data={categoryTotals} />
            <TrendLineChart data={monthSeries} />
          </div>

          <InsightsSection insights={insights} />
        </>
      )}
    </div>
  );
}

export default Dashboard;
