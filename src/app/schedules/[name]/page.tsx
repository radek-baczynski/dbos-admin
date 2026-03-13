"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { WorkflowSchedule } from "@/types/schedule";

function JsonBlock({ data }: { data: unknown }) {
  const str =
    data === undefined || data === null
      ? "—"
      : typeof data === "object"
        ? JSON.stringify(data, null, 2)
        : String(data);
  return (
    <pre className="max-h-64 overflow-auto rounded-[var(--radius)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--text-muted)] whitespace-pre-wrap break-all">
      {str}
    </pre>
  );
}

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const name = typeof params.name === "string" ? params.name : "";
  const [schedule, setSchedule] = useState<WorkflowSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [backfillStart, setBackfillStart] = useState("");
  const [backfillEnd, setBackfillEnd] = useState("");
  const [backfillResult, setBackfillResult] = useState<string[] | null>(null);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchSchedule = useCallback(async () => {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/schedules/${encodeURIComponent(name)}`
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || res.statusText);
      }
      const data = await res.json();
      setSchedule(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load schedule");
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const doAction = async (
    action: "pause" | "resume",
    label: string
  ) => {
    setActionLoading(label);
    setError(null);
    try {
      const res = await fetch(
        `/api/schedules/${encodeURIComponent(name)}/${action}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || res.statusText);
      }
      await fetchSchedule();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const doTrigger = async () => {
    setActionLoading("Trigger");
    setError(null);
    setTriggerResult(null);
    try {
      const res = await fetch(
        `/api/schedules/${encodeURIComponent(name)}/trigger`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setTriggerResult(data.workflowID);
      router.push(`/workflows?detail=${encodeURIComponent(data.workflowID)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to trigger");
    } finally {
      setActionLoading(null);
    }
  };

  const doBackfill = async () => {
    const start = backfillStart ? new Date(backfillStart) : null;
    const end = backfillEnd ? new Date(backfillEnd) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Enter valid start and end dates");
      return;
    }
    setActionLoading("Backfill");
    setError(null);
    setBackfillResult(null);
    try {
      const res = await fetch(
        `/api/schedules/${encodeURIComponent(name)}/backfill`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: start.toISOString(),
            end: end.toISOString(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setBackfillResult(data.workflowIDs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to backfill");
    } finally {
      setActionLoading(null);
    }
  };

  const doDelete = async () => {
    setActionLoading("Delete");
    setError(null);
    try {
      const res = await fetch(
        `/api/schedules/${encodeURIComponent(name)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || res.statusText);
      }
      router.push("/schedules");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setActionLoading(null);
      setConfirmDelete(false);
    }
  };

  if (loading && !schedule) {
    return (
      <div className="relative z-10 p-8 md:p-10">
        <div className="py-16 text-center text-[var(--text-muted)]">
          Loading schedule…
        </div>
      </div>
    );
  }

  if (error && !schedule) {
    return (
      <div className="relative z-10 p-8 md:p-10">
        <div
          className="rounded-[var(--radius)] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
        <Link
          href="/schedules"
          className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
        >
          ← Back to Schedules
        </Link>
      </div>
    );
  }

  const s = schedule!;
  const isActive = s.status === "ACTIVE";

  return (
    <div className="relative z-10 p-8 md:p-10">
      <div style={{ animation: "fadeIn 0.4s ease backwards" }}>
        <Link
          href="/schedules"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← Schedules
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-[var(--text)]">
          {s.scheduleName}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {s.workflowClassName ? `${s.workflowClassName}.` : ""}
          {s.workflowName}
        </p>
        <div className="mt-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isActive
                ? "bg-[var(--success)]/20 text-[var(--success)]"
                : "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
            }`}
          >
            {s.status}
          </span>
        </div>
      </div>

      {error && (
        <div
          className="mt-4 rounded-[var(--radius)] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      <div
        className="mt-6 flex flex-wrap items-center gap-3"
        style={{ animation: "fadeIn 0.4s ease 0.05s backwards" }}
      >
        {isActive && (
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={() => doAction("pause", "Pause")}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--border)] disabled:opacity-50"
          >
            {actionLoading === "Pause" ? "Pausing…" : "Pause"}
          </button>
        )}
        {!isActive && (
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={() => doAction("resume", "Resume")}
            className="rounded-[var(--radius)] bg-[var(--success)]/20 px-4 py-2 text-sm font-medium text-[var(--success)] transition hover:bg-[var(--success)]/30 disabled:opacity-50"
          >
            {actionLoading === "Resume" ? "Resuming…" : "Resume"}
          </button>
        )}
        <button
          type="button"
          disabled={!!actionLoading}
          onClick={doTrigger}
          className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:opacity-50"
        >
          {actionLoading === "Trigger" ? "Triggering…" : "Trigger now"}
        </button>
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={backfillStart}
            onChange={(e) => setBackfillStart(e.target.value)}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <input
            type="datetime-local"
            value={backfillEnd}
            onChange={(e) => setBackfillEnd(e.target.value)}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={doBackfill}
            className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:opacity-50"
          >
            {actionLoading === "Backfill" ? "Backfilling…" : "Backfill"}
          </button>
        </div>
        {!confirmDelete ? (
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={() => setConfirmDelete(true)}
            className="rounded-[var(--radius)] border border-[var(--error)]/50 bg-[var(--error)]/10 px-4 py-2 text-sm font-medium text-[var(--error)] transition hover:bg-[var(--error)]/20 disabled:opacity-50"
          >
            Delete
          </button>
        ) : (
          <>
            <span className="text-sm text-[var(--text-muted)]">
              Delete this schedule?
            </span>
            <button
              type="button"
              disabled={!!actionLoading}
              onClick={doDelete}
              className="rounded-[var(--radius)] bg-[var(--error)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === "Delete" ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-muted)]"
            >
              Cancel
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => fetchSchedule()}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)]"
        >
          Refresh
        </button>
      </div>

      {triggerResult && (
        <p className="mt-2 text-sm text-[var(--success)]">
          Triggered workflow{" "}
          <Link
            href={`/workflows?detail=${encodeURIComponent(triggerResult)}`}
            className="font-mono text-[var(--accent)] hover:underline"
          >
            {triggerResult}
          </Link>
        </p>
      )}

      {backfillResult && backfillResult.length > 0 && (
        <p className="mt-2 text-sm text-[var(--success)]">
          Backfill started {backfillResult.length} workflow(s):{" "}
          {backfillResult.slice(0, 3).map((id) => (
            <Link
              key={id}
              href={`/workflows?detail=${encodeURIComponent(id)}`}
              className="font-mono text-[var(--accent)] hover:underline"
            >
              {id}
            </Link>
          ))}
          {backfillResult.length > 3 && ` +${backfillResult.length - 3} more`}
        </p>
      )}

      <section
        className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
        style={{ animation: "fadeIn 0.4s ease 0.1s backwards" }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Details
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--text-muted)]">Schedule ID</dt>
            <dd className="font-mono text-sm text-[var(--text)]">
              {s.scheduleId}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-muted)]">Cron</dt>
            <dd className="font-mono text-sm text-[var(--text)]">
              {s.schedule}
            </dd>
          </div>
        </dl>
        {s.context != null && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-[var(--text-muted)]">
              Context
            </h3>
            <JsonBlock data={s.context} />
          </div>
        )}
      </section>
    </div>
  );
}
