"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { defaultRefetchInterval } from "@/components/QueryProvider";

const statusDotClass: Record<string, string> = {
  SUCCESS: "bg-[var(--success)]",
  ERROR: "bg-[var(--error)]",
  PENDING: "bg-[var(--pending)]",
  ENQUEUED: "bg-[var(--pending)]",
  CANCELLED: "bg-[var(--cancelled)]",
  MAX_RECOVERY_ATTEMPTS_EXCEEDED: "bg-[var(--cancelled)]",
};

/** workflowName -> status -> count */
type WorkflowNameStats = Record<string, Record<string, number>>;

interface WorkflowStats {
  total: WorkflowNameStats;
  last24h: WorkflowNameStats;
}

async function fetchStats(): Promise<WorkflowStats> {
  const res = await fetch("/api/workflows/stats");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
  return res.json();
}

function totalForStatuses(statusCounts: Record<string, number>): number {
  return Object.values(statusCounts).reduce((a, b) => a + b, 0);
}

function workflowStatusLink(
  workflowName: string,
  status: string,
  last24h: boolean
): string {
  const params = new URLSearchParams();
  params.set("workflowName", workflowName);
  if (status === "ENQUEUED") {
    params.set("mode", "queued");
    params.set("status", "ENQUEUED");
  } else {
    params.set("status", status);
  }
  if (last24h) {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    params.set("startTime", start.toISOString());
    params.set("endTime", end.toISOString());
    params.set("timePreset", "24h");
  }
  return `/workflows?${params.toString()}`;
}

function StatusRow({
  label,
  statusCounts,
  workflowName,
  last24h,
  alwaysShow,
}: {
  label: string;
  statusCounts: Record<string, number>;
  workflowName: string;
  last24h: boolean;
  alwaysShow?: boolean;
}) {
  const entries = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);
  if (entries.length === 0 && !alwaysShow) return null;
  return (
    <div className="mt-2">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      {entries.length === 0 ? (
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">—</p>
      ) : (
        <ul className="mt-1 flex flex-wrap gap-2">
          {entries.map(([status, count]) => (
            <li key={status} className="flex items-center gap-1.5 text-xs">
              <Link
                href={workflowStatusLink(workflowName, status, last24h)}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 rounded px-1.5 py-0.5 transition hover:bg-[var(--bg-muted)]"
                title={`${status}: ${count}`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass[status] ?? "bg-[var(--text-muted)]"}`}
                  aria-hidden
                />
                <span className="font-mono tabular-nums text-[var(--text)]">
                  {count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DashboardStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow-stats"],
    queryFn: fetchStats,
    refetchInterval: defaultRefetchInterval,
  });

  if (error) {
    return (
      <div
        className="rounded-[var(--radius)] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
        role="alert"
      >
        {error instanceof Error ? error.message : "Failed to load stats"}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
        <p className="text-sm text-[var(--text-muted)]">Loading stats…</p>
      </div>
    );
  }

  const totalMap = data.total ?? {};
  const last24hMap = data.last24h ?? {};
  const allNames = new Set([...Object.keys(totalMap), ...Object.keys(last24hMap)]);
  const workflowEntries = Array.from(allNames)
    .map((name) => ({
      name,
      totalCounts: totalMap[name] ?? {},
      last24hCounts: last24hMap[name] ?? {},
      total: totalForStatuses(totalMap[name] ?? {}),
    }))
    .filter((e) => e.total > 0 || totalForStatuses(e.last24hCounts) > 0)
    .sort((a, b) => Math.max(b.total, totalForStatuses(b.last24hCounts)) - Math.max(a.total, totalForStatuses(a.last24hCounts)));

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-[var(--text-muted)]">
        Workflows by name — status stats
      </h2>
      {workflowEntries.length === 0 ? (
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
          style={{ animation: "fadeIn 0.5s ease 0.05s backwards" }}
        >
          <p className="text-sm text-[var(--text-muted)]">
            No workflow runs in the recent window.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          style={{ animation: "fadeIn 0.5s ease 0.05s backwards" }}
        >
          {workflowEntries.map(({ name, totalCounts, last24hCounts, total }, i) => (
            <Link
              key={name}
              href={`/workflows?workflowName=${encodeURIComponent(name)}`}
              className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-muted)]"
              style={{
                animation: `fadeIn 0.5s ease ${0.05 + i * 0.03}s backwards`,
              }}
            >
              <span className="truncate text-sm font-medium text-[var(--text)]">
                {name}
              </span>
              <span className="mt-0.5 text-xs text-[var(--text-muted)]">
                {total} total
              </span>
              <StatusRow
                label="Total"
                statusCounts={totalCounts}
                workflowName={name}
                last24h={false}
              />
              <StatusRow
                label="Last 24h"
                statusCounts={last24hCounts}
                workflowName={name}
                last24h={true}
                alwaysShow
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
