import { useMemo } from "react";
import { Link } from "react-router-dom";
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div
            key={card}
            className="rounded-lg border border-line bg-white p-5"
          >
            <div className="h-3 w-24 rounded bg-paper-dim" />
            <div className="mt-3 h-7 w-32 rounded bg-paper-dim" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-lg border border-line bg-white p-5">
          <div className="h-3 w-40 rounded bg-paper-dim" />
        </div>
        <div className="h-80 rounded-lg border border-line bg-white p-5">
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
        className="mt-5 inline-flex touch-manipulation items-center justify-center rounded-md bg-ledger px-4 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-ledger/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger"
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
}

const SUMMARY_TONE_CLASS: Record<SummaryCardProps["tone"], string> = {
  income: "text-ledger",
  expense: "text-ink",
  positive: "text-ledger",
  negative: "text-rust",
};

function SummaryCard({ label, amount, tone }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
        {label}
      </p>
      <p
        className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${SUMMARY_TONE_CLASS[tone]}`}
      >
        {amountFormatter.format(amount)}
      </p>
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
    <div className="rounded-lg border border-line bg-white p-5">
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
                stroke="#fff"
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
                formatter={(value: number) => amountFormatter.format(value)}
                contentStyle={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  borderColor: "var(--color-line)",
                }}
                itemStyle={{
                  fontFamily: "var(--font-mono)",
                  fontVariantNumeric: "tabular-nums",
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
    <div className="rounded-lg border border-line bg-white p-5">
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
              formatter={(value: number) => amountFormatter.format(value)}
              contentStyle={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                borderColor: "var(--color-line)",
              }}
              itemStyle={{
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
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
    <div className="mt-6 rounded-lg border border-line border-t-2 border-t-ledger-light bg-white p-5">
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

  const currentMonthTransactions = useMemo(
    () => filterByMonth(transactions, currentMonthKey()),
    [transactions],
  );
  const totalIncome = useMemo(
    () => sumByType(currentMonthTransactions, "income"),
    [currentMonthTransactions],
  );
  const totalExpenses = useMemo(
    () => sumByType(currentMonthTransactions, "expense"),
    [currentMonthTransactions],
  );
  const netSavings = totalIncome - totalExpenses;
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
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Income this month"
              amount={totalIncome}
              tone="income"
            />
            <SummaryCard
              label="Expenses this month"
              amount={totalExpenses}
              tone="expense"
            />
            <SummaryCard
              label="Net savings"
              amount={netSavings}
              tone={netSavings >= 0 ? "positive" : "negative"}
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
