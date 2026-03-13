"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSchedulePage() {
  const router = useRouter();
  const [scheduleName, setScheduleName] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [workflowClassName, setWorkflowClassName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [contextStr, setContextStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!scheduleName.trim() || !workflowName.trim() || !schedule.trim()) {
      setError("Schedule name, workflow name, and schedule (cron) are required");
      return;
    }
    let context: unknown = undefined;
    if (contextStr.trim()) {
      try {
        context = JSON.parse(contextStr.trim());
      } catch {
        setError("Context must be valid JSON or empty");
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleName: scheduleName.trim(),
          workflowName: workflowName.trim(),
          workflowClassName: workflowClassName.trim() || undefined,
          schedule: schedule.trim(),
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      router.push(`/schedules/${encodeURIComponent(scheduleName.trim())}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 p-8 md:p-10">
      <div style={{ animation: "fadeIn 0.4s ease backwards" }}>
        <Link
          href="/schedules"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← Schedules
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)]">
          Create schedule
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Register a new scheduled workflow (cron).
        </p>
      </div>

      {error && (
        <div
          className="mt-4 rounded-[var(--radius)] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-xl space-y-4"
        style={{ animation: "fadeIn 0.4s ease 0.05s backwards" }}
      >
        <div>
          <label
            htmlFor="scheduleName"
            className="block text-sm font-medium text-[var(--text-muted)]"
          >
            Schedule name
          </label>
          <input
            id="scheduleName"
            type="text"
            value={scheduleName}
            onChange={(e) => setScheduleName(e.target.value)}
            placeholder="e.g. daily-report"
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label
            htmlFor="workflowName"
            className="block text-sm font-medium text-[var(--text-muted)]"
          >
            Workflow name
          </label>
          <input
            id="workflowName"
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="e.g. runReport"
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label
            htmlFor="workflowClassName"
            className="block text-sm font-medium text-[var(--text-muted)]"
          >
            Workflow class name (optional)
          </label>
          <input
            id="workflowClassName"
            type="text"
            value={workflowClassName}
            onChange={(e) => setWorkflowClassName(e.target.value)}
            placeholder="e.g. ReportWorkflow"
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label
            htmlFor="schedule"
            className="block text-sm font-medium text-[var(--text-muted)]"
          >
            Schedule (cron)
          </label>
          <input
            id="schedule"
            type="text"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="e.g. 0 9 * * * (daily at 09:00)"
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label
            htmlFor="context"
            className="block text-sm font-medium text-[var(--text-muted)]"
          >
            Context (optional JSON)
          </label>
          <textarea
            id="context"
            value={contextStr}
            onChange={(e) => setContextStr(e.target.value)}
            placeholder='e.g. {"region": "us"}'
            rows={3}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-[var(--radius)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create schedule"}
          </button>
          <Link
            href="/schedules"
            className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-muted)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
