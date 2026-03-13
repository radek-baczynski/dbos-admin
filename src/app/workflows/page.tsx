"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowDetailContent } from "@/components/WorkflowDetailContent";
import { WorkflowDetailDrawer } from "@/components/WorkflowDetailDrawer";
import { WorkflowFiltersSidebar } from "@/components/WorkflowFiltersSidebar";
import { defaultRefetchInterval } from "@/components/QueryProvider";
import type { WorkflowStatus } from "@/types/workflow";

const PAGE_SIZE = 20;

const TIME_PRESET_KEYS = ["5m", "1h", "today", "24h", "7d"] as const;

const TIME_QUICK_FILTERS: {
  key: (typeof TIME_PRESET_KEYS)[number];
  label: string;
  getRange: () => { start: Date; end: Date };
}[] = [
  {
    key: "5m",
    label: "Last 5 minutes",
    getRange: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 5 * 60 * 1000);
      return { start, end };
    },
  },
  {
    key: "1h",
    label: "Last 1 hour",
    getRange: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      return { start, end };
    },
  },
  {
    key: "today",
    label: "Today",
    getRange: () => {
      const end = new Date();
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    key: "24h",
    label: "Last 24h",
    getRange: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      return { start, end };
    },
  },
  {
    key: "7d",
    label: "Last 7 days",
    getRange: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start, end };
    },
  },
];

function formatTime(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

const INPUT_PREVIEW_MAX = 60;

function formatInputPreview(input: unknown[] | undefined): string {
  if (input == null) return "—";
  const arr = Array.isArray(input) ? input : [input];
  if (arr.length === 0) return "—";
  try {
    const raw = JSON.stringify(arr);
    if (raw.length <= INPUT_PREVIEW_MAX) return raw;
    return raw.slice(0, INPUT_PREVIEW_MAX).trim() + "…";
  } catch {
    return "—";
  }
}

async function fetchWorkflows(
  params: URLSearchParams,
  mode: "all" | "queued"
): Promise<WorkflowStatus[]> {
  const base = mode === "queued" ? "/api/workflows/queued" : "/api/workflows";
  const res = await fetch(`${base}?${params}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
  return res.json();
}

export default function WorkflowsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const detailId = searchParams.get("detail");

  const closeDrawer = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("detail");
    const q = p.toString();
    router.replace(pathname + (q ? `?${q}` : ""));
  }, [pathname, router, searchParams]);

  const openWorkflowInDrawer = useCallback(
    (id: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("detail", id);
      router.replace(`${pathname}?${p.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const handleRerun = useCallback(
    async (workflowId: string) => {
      setRerunningId(workflowId);
      try {
        const res = await fetch(`/api/workflows/${workflowId}/fork`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startStep: 0 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        openWorkflowInDrawer(data.workflowID);
      } catch {
        // Error could be shown via toast or inline; for now just stop loading
      } finally {
        setRerunningId(null);
      }
    },
    [openWorkflowInDrawer]
  );

  const mode =
    searchParams.get("mode") === "queued" ||
    searchParams.get("status") === "ENQUEUED"
      ? "queued"
      : "all";

  const listView: "all" | "queued" | "error" =
    mode === "queued"
      ? "queued"
      : searchParams.get("status") === "ERROR"
        ? "error"
        : "all";

  const activeTimePreset = searchParams.get("timePreset") ?? null;

  const page = Math.max(
    0,
    parseInt(searchParams.get("page") ?? "0", 10) || 0
  );

  const apiParams = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("mode");
    p.delete("timePreset");
    p.delete("detail");
    p.set("limit", String(PAGE_SIZE));
    p.set("offset", String(page * PAGE_SIZE));
    p.set("sortDesc", "true");
    p.set("loadInput", "true");
    return p;
  }, [searchParams, page]);

  const {
    data: workflows = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["workflows", mode, apiParams.toString()],
    queryFn: () => fetchWorkflows(apiParams, mode),
    refetchInterval: defaultRefetchInterval,
  });

  const setMode = useCallback(
    (nextView: "all" | "queued" | "error") => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("page");
      if (nextView === "queued") {
        p.set("mode", "queued");
        p.set("status", "ENQUEUED");
      } else if (nextView === "error") {
        p.delete("mode");
        p.set("status", "ERROR");
      } else {
        p.delete("mode");
        if (p.get("status") === "ENQUEUED") p.delete("status");
        if (p.get("status") === "ERROR") p.delete("status");
      }
      const q = p.toString();
      router.replace(pathname + (q ? `?${q}` : ""));
    },
    [pathname, router, searchParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const p = new URLSearchParams(searchParams.toString());
      if (nextPage <= 0) p.delete("page");
      else p.set("page", String(nextPage));
      const q = p.toString();
      router.replace(pathname + (q ? `?${q}` : ""));
    },
    [pathname, router, searchParams]
  );

  const setTimeRange = useCallback(
    (start: Date, end: Date, timePreset: string | null) => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("page");
      p.set("startTime", start.toISOString());
      p.set("endTime", end.toISOString());
      if (timePreset) p.set("timePreset", timePreset);
      else p.delete("timePreset");
      const q = p.toString();
      router.replace(pathname + (q ? `?${q}` : ""));
    },
    [pathname, router, searchParams]
  );

  const clearTimeRange = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    p.delete("startTime");
    p.delete("endTime");
    p.delete("timePreset");
    const q = p.toString();
    router.replace(pathname + (q ? `?${q}` : ""));
  }, [pathname, router, searchParams]);

  const totalFetched = workflows.length;
  const hasMore = totalFetched === PAGE_SIZE;
  const hasPrev = page > 0;

  return (
    <div className="relative z-10 flex p-8 md:p-10">
      <WorkflowFiltersSidebar />
      <div className="min-w-0 flex-1 pl-6">
        <div style={{ animation: "fadeIn 0.4s ease backwards" }}>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            Workflows
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {listView === "queued"
              ? "Workflows waiting in queues (PENDING or ENQUEUED)."
              : listView === "error"
                ? "Workflows that ended with an error."
                : "Execution history. Click a row to view details and debug."}
          </p>
        </div>

        <div
          className="mt-6 flex flex-wrap items-center gap-4"
          style={{ animation: "fadeIn 0.4s ease 0.05s backwards" }}
        >
          <div
            className="flex rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5"
            role="tablist"
            aria-label="List mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={listView === "all"}
              onClick={() => setMode("all")}
              className={`rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition ${
                listView === "all"
                  ? "bg-[var(--accent)] text-[var(--bg)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              All runs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={listView === "queued"}
              onClick={() => setMode("queued")}
              className={`rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition ${
                listView === "queued"
                  ? "bg-[var(--accent)] text-[var(--bg)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Queued only
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={listView === "error"}
              onClick={() => setMode("error")}
              className={`rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition ${
                listView === "error"
                  ? "bg-[var(--accent)] text-[var(--bg)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Error
            </button>
          </div>
          <div
            className="flex flex-wrap rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5"
            role="group"
            aria-label="Time range"
          >
            {TIME_QUICK_FILTERS.map(({ key, label, getRange }) => {
              const isSelected = activeTimePreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (isSelected) clearTimeRange();
                    else {
                      const { start, end } = getRange();
                      setTimeRange(start, end, key);
                    }
                  }}
                  aria-pressed={isSelected}
                  className={`rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "bg-[var(--accent)] text-[var(--bg)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-[var(--radius)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition hover:bg-[var(--accent-hover)]"
          >
            Refresh
          </button>
        </div>

        {queryError && (
          <div
            className="mt-4 rounded-[var(--radius)] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
            role="alert"
          >
            {queryError instanceof Error
              ? queryError.message
              : "Failed to load workflows"}
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
          ) : workflows.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-muted)]">
              {listView === "queued"
                ? "No queued workflows. Queues are empty or no workflows match."
                : listView === "error"
                  ? "No failed workflows in this range."
                  : "No workflows found. Adjust filters or run some workflows in your DBOS app."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                      Workflow ID
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                      Name
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                      Created
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                      Last activity
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                      Input
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                      Queue
                    </th>
                    <th className="w-20 px-4 py-3 font-medium text-[var(--text-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((w, i) => (
                    <tr
                      key={w.workflowID}
                      className="border-b border-[var(--border)]/60 transition hover:bg-[var(--bg-muted)]"
                      style={{
                        animation: `fadeIn 0.3s ease ${i * 0.02}s backwards`,
                      }}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/workflows?${(() => {
                            const p = new URLSearchParams(
                              searchParams.toString()
                            );
                            p.set("detail", w.workflowID);
                            return p.toString();
                          })()}`}
                          className="font-mono text-xs text-[var(--accent)] hover:underline"
                        >
                          {w.workflowID}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--text)]">
                        {w.workflowName}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                        {formatTime(w.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                        {w.updatedAt != null ? formatTime(w.updatedAt) : "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-[var(--text-muted)]" title={typeof w.input !== "undefined" ? JSON.stringify(w.input) : undefined}>
                        {formatInputPreview(w.input)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {w.queueName || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={rerunningId === w.workflowID}
                          onClick={(e) => {
                            e.preventDefault();
                            handleRerun(w.workflowID);
                          }}
                          className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1.5 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:opacity-50"
                          title="Rerun workflow from the beginning"
                        >
                          {rerunningId === w.workflowID ? "Rerunning…" : "Rerun"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && workflows.length > 0 && (
            <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
              <span className="text-sm text-[var(--text-muted)]">
                Page {page + 1}
                {hasMore && " (more available)"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => setPage(page - 1)}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm font-medium text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-[var(--border)]"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!hasMore}
                  onClick={() => setPage(page + 1)}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm font-medium text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-[var(--border)]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailId && (
        <WorkflowDetailDrawer open onClose={closeDrawer}>
          <WorkflowDetailContent
            workflowId={detailId}
            onClose={closeDrawer}
            onOpenWorkflow={openWorkflowInDrawer}
          />
        </WorkflowDetailDrawer>
      )}
    </div>
  );
}
