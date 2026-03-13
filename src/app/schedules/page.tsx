"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { WorkflowSchedule } from "@/types/schedule";

const STATUS_OPTIONS = ["", "ACTIVE", "PAUSED"];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<WorkflowSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [namePrefix, setNamePrefix] = useState("");

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (namePrefix.trim()) params.set("scheduleNamePrefix", namePrefix.trim());
      const res = await fetch(`/api/schedules?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setSchedules(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load schedules");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, namePrefix]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return (
    <div className="relative z-10 p-8 md:p-10">
      <div style={{ animation: "fadeIn 0.4s ease backwards" }}>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          Schedules
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Scheduled workflows (cron). View, trigger, backfill, or pause.
        </p>
      </div>

      <div
        className="mt-6 flex flex-wrap items-center gap-4"
        style={{ animation: "fadeIn 0.4s ease 0.05s backwards" }}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm text-[var(--text-muted)]">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "All"}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="prefix" className="text-sm text-[var(--text-muted)]">
            Name prefix
          </label>
          <input
            id="prefix"
            type="text"
            value={namePrefix}
            onChange={(e) => setNamePrefix(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchSchedules()}
            placeholder="Filter by name"
            className="w-48 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <button
          type="button"
          onClick={() => fetchSchedules()}
          className="rounded-[var(--radius)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition hover:bg-[var(--accent-hover)]"
        >
          Refresh
        </button>
        <Link
          href="/schedules/new"
          className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
        >
          Create schedule
        </Link>
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
        className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)]"
        style={{ animation: "fadeIn 0.4s ease 0.1s backwards" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
            Loading…
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)]">
            No schedules found. Create one or adjust filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                    Schedule name
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                    Workflow
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                    Cron
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s, i) => (
                  <tr
                    key={s.scheduleId}
                    className="border-b border-[var(--border)]/60 transition hover:bg-[var(--bg-muted)]"
                    style={{
                      animation: `fadeIn 0.3s ease ${i * 0.02}s backwards`,
                    }}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/schedules/${encodeURIComponent(s.scheduleName)}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {s.scheduleName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--text)]">
                      {s.workflowClassName ? `${s.workflowClassName}.` : ""}
                      {s.workflowName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                      {s.schedule}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          s.status === "ACTIVE"
                            ? "bg-[var(--success)]/20 text-[var(--success)]"
                            : "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
