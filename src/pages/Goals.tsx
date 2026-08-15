import { useMemo, useRef, useState } from "react";
import { AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useGoals, type Goal } from "../hooks/useGoals";
import { useTransactions } from "../hooks/useTransactions";
import { sumContributionsByGoal } from "../lib/dashboardAnalytics";
import {
  amountFormatter,
  dateFormatter,
  todayISODate,
} from "../lib/formatters";
import { supabase } from "../lib/supabase";
import GoalForm from "../components/GoalForm";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

function GoalsSkeleton() {
  return (
    <div className="mt-6 animate-pulse motion-reduce:animate-none">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((row) => (
          <div key={row} className="rounded-lg border border-line bg-card p-5">
            <div className="h-3.5 w-24 rounded bg-paper-dim" />
            <div className="mt-3 h-4 w-40 rounded bg-paper-dim" />
            <div className="mt-3 h-2 w-full rounded-full bg-paper-dim" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsEmptyState() {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-line px-6 py-16 text-center">
      <p className="font-body text-base font-medium text-ink">
        No goals set yet.
      </p>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Set a target amount and date above to start tracking progress toward it.
      </p>
    </div>
  );
}

interface GoalRowProps {
  goal: Goal;
  contributed: number;
  onEdit: (goal: Goal) => void;
  onDeleteRequest: (goal: Goal, trigger: HTMLButtonElement) => void;
}

function GoalRow({ goal, contributed, onEdit, onDeleteRequest }: GoalRowProps) {
  const percent =
    goal.target_amount > 0 ? (contributed / goal.target_amount) * 100 : 0;
  const barWidth = Math.min(percent, 100);
  const isReached = contributed >= goal.target_amount;
  const isOverdue = !isReached && goal.target_date < todayISODate();
  const remaining = Math.max(goal.target_amount - contributed, 0);
  const targetDateLabel = dateFormatter.format(
    new Date(`${goal.target_date}T00:00:00`),
  );

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="break-words font-body text-sm font-medium text-ink">
          {goal.name}
        </h3>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            aria-label={`Edit ${goal.name} goal`}
            className="touch-manipulation rounded-md p-1.5 text-ink-soft transition-colors hover:bg-paper-dim hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(event) => onDeleteRequest(goal, event.currentTarget)}
            aria-label={`Delete ${goal.name} goal`}
            className="touch-manipulation rounded-md p-1.5 text-ink-soft transition-colors hover:bg-rust/10 hover:text-rust focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ledger"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="mt-2 font-mono text-sm tabular-nums">
        <span
          className={
            isReached ? "font-semibold text-ledger" : "font-semibold text-ink"
          }
        >
          {amountFormatter.format(contributed)}
        </span>
        <span className="text-ink-soft">
          {" "}
          / {amountFormatter.format(goal.target_amount)}
        </span>
      </p>

      <div
        role="progressbar"
        aria-valuenow={Math.round(barWidth)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name} progress: ${Math.round(percent)}% of target`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-paper-dim"
      >
        <div
          className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${
            isOverdue ? "bg-rust" : "bg-ledger"
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <p
        className={`mt-2 font-body text-xs ${
          isOverdue ? "font-medium text-rust" : "text-ink-soft"
        }`}
      >
        {isReached
          ? `Goal reached — target was ${targetDateLabel}`
          : isOverdue
            ? `Target date passed — ${amountFormatter.format(remaining)} to go`
            : `${amountFormatter.format(remaining)} to go by ${targetDateLabel}`}
      </p>
    </div>
  );
}

function Goals() {
  const { goals, loading, error, refetch } = useGoals();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);

  const editingGoal = goals.find((g) => g.id === editingId) ?? null;
  const deletingGoal = goals.find((g) => g.id === deletingId) ?? null;

  const contributionsByGoal = useMemo(
    () => sumContributionsByGoal(transactions),
    [transactions],
  );

  function handleEdit(goal: Goal) {
    setEditingId(goal.id);
  }

  function handleDeleteRequest(goal: Goal, trigger: HTMLButtonElement) {
    deleteTriggerRef.current = trigger;
    setDeleteError(null);
    setDeletingId(goal.id);
  }

  function handleCancelDelete() {
    setDeletingId(null);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!deletingGoal) return;
    setDeleting(true);
    const { error: deleteRequestError } = await supabase
      .from("goals")
      .delete()
      .eq("id", deletingGoal.id);
    setDeleting(false);

    if (deleteRequestError) {
      console.error("[goals] delete failed:", deleteRequestError);
      setDeleteError("Couldn’t delete this goal. Try again.");
      return;
    }

    setDeletingId(null);
    if (editingId === deletingGoal.id) setEditingId(null);
    refetch();
  }

  const isLoading = loading || transactionsLoading;

  return (
    <div>
      <div inert={!!deletingGoal || undefined}>
        <h1 className="font-display text-2xl font-semibold text-ink">Goals</h1>
        <p className="mt-1 font-body text-sm text-ink-soft">
          Savings targets — add income to a goal from the transaction form to
          track progress
        </p>

        <div className="mt-6">
          <GoalForm
            key={editingId ?? "new"}
            editingGoal={editingGoal}
            onSaved={() => {
              setEditingId(null);
              refetch();
            }}
            onCancelEdit={() => setEditingId(null)}
          />
        </div>

        {error && (
          <div
            aria-live="polite"
            className="mt-6 flex items-start gap-2 rounded-md border border-rust/30 bg-rust/5 px-3 py-2 font-body text-sm text-rust"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0">
              Couldn&rsquo;t load your goals. Try refreshing the page.
            </span>
          </div>
        )}

        {!error && isLoading && <GoalsSkeleton />}

        {!error && !isLoading && goals.length === 0 && <GoalsEmptyState />}

        {!error && !isLoading && goals.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {goals.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                contributed={contributionsByGoal.get(goal.id) ?? 0}
                onEdit={handleEdit}
                onDeleteRequest={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </div>

      {deletingGoal && (
        <ConfirmDeleteDialog
          title="Delete goal?"
          description={`${deletingGoal.name} (${amountFormatter.format(deletingGoal.target_amount)})`}
          deleting={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          triggerRef={deleteTriggerRef}
        />
      )}
    </div>
  );
}

export default Goals;
