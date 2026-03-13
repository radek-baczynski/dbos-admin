"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { CustomFilterDef } from "@/lib/custom-filters";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "ENQUEUED", label: "Queued" },
  { value: "SUCCESS", label: "SUCCESS" },
  { value: "ERROR", label: "ERROR" },
  { value: "PENDING", label: "PENDING" },
  { value: "CANCELLED", label: "CANCELLED" },
  { value: "MAX_RECOVERY_ATTEMPTS_EXCEEDED", label: "MAX_RECOVERY_ATTEMPTS_EXCEEDED" },
];

const RECENT_VALUES_MAX = 20;
const STORAGE_PREFIX = "dbos-filter-";

function getRecentValues(paramKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + paramKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, RECENT_VALUES_MAX)
      : [];
  } catch {
    return [];
  }
}

function addRecentValue(paramKey: string, value: string) {
  if (typeof window === "undefined" || !value.trim()) return;
  const recent = getRecentValues(paramKey).filter((v) => v !== value.trim());
  recent.unshift(value.trim());
  try {
    localStorage.setItem(
      STORAGE_PREFIX + paramKey,
      JSON.stringify(recent.slice(0, RECENT_VALUES_MAX))
    );
  } catch {
    /* ignore */
  }
}

interface ConfigResponse {
  customFilters: CustomFilterDef[];
}

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";
const labelClass = "block text-sm font-medium text-[var(--text-muted)] mb-1";

export function WorkflowFiltersSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value.trim()) p.set(key, value.trim());
      else p.delete(key);
      p.delete("page");
      // Sync status ENQUEUED with mode (top table shows queued list)
      if (key === "status") {
        if (value === "ENQUEUED") p.set("mode", "queued");
        else p.delete("mode");
      }
      // Clear time preset when user changes date range manually
      if (key === "startTime" || key === "endTime") p.delete("timePreset");
      const q = p.toString();
      router.replace(pathname + (q ? `?${q}` : ""));
    },
    [pathname, router, searchParams]
  );

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: async (): Promise<ConfigResponse> => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to load config");
      return res.json();
    },
    staleTime: 60_000,
  });

  const customFilters = config?.customFilters ?? [];

  interface FilterOptionsResponse {
    queueNames: string[];
    workflowNames: string[];
  }

  const { data: filterOptions } = useQuery({
    queryKey: ["workflows-filter-options"],
    queryFn: async (): Promise<FilterOptionsResponse> => {
      const res = await fetch("/api/workflows/filter-options");
      if (!res.ok) return { queueNames: [], workflowNames: [] };
      return res.json();
    },
    staleTime: 30_000,
  });

  const queueOptions = filterOptions?.queueNames ?? [];
  const workflowNameOptions = filterOptions?.workflowNames ?? [];

  const filterKeys = useMemo(
    () => ["q", "workflowName", "status", "queueName", "startTime", "endTime", "mode", "page", ...customFilters.map((f) => f.paramKey)],
    [customFilters]
  );

  const hasAnyFilter = useMemo(() => {
    for (const key of filterKeys) {
      if (searchParams.get(key)) return true;
    }
    return searchParams.get("mode") === "queued";
  }, [filterKeys, searchParams]);

  const clearAllFilters = useCallback(() => {
    const p = new URLSearchParams();
    const q = p.toString();
    router.replace(pathname + (q ? `?${q}` : ""));
  }, [pathname, router]);

  return (
    <aside
      className="w-64 shrink-0 space-y-6 border-r border-[var(--border)] pr-6"
      aria-label="Filters"
    >
      {hasAnyFilter && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-muted)] py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--border)] hover:text-[var(--text)]"
        >
          Clear all filters
        </button>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="filter-q" className={labelClass}>
            Search by text
          </label>
          {searchParams.get("q") && (
            <button
              type="button"
              onClick={() => updateParam("q", "")}
              className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>
        <input
          id="filter-q"
          type="text"
          value={searchParams.get("q") ?? ""}
          onChange={(e) => updateParam("q", e.target.value)}
          placeholder="ID, name…"
          className={inputClass}
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="filter-workflowName" className={labelClass}>
            Workflow name
          </label>
          {searchParams.get("workflowName") && (
            <button
              type="button"
              onClick={() => updateParam("workflowName", "")}
              className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Clear workflow name"
            >
              Clear
            </button>
          )}
        </div>
        <select
          id="filter-workflowName"
          value={searchParams.get("workflowName") ?? ""}
          onChange={(e) => updateParam("workflowName", e.target.value)}
          className={inputClass}
        >
          <option value="">All</option>
          {workflowNameOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="filter-status" className={labelClass}>
            Status
          </label>
          {(searchParams.get("status") || searchParams.get("mode") === "queued") && (
            <button
              type="button"
              onClick={() => updateParam("status", "")}
              className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Clear status"
            >
              Clear
            </button>
          )}
        </div>
        <select
          id="filter-status"
          value={
            searchParams.get("status") ??
            (searchParams.get("mode") === "queued" ? "ENQUEUED" : "")
          }
          onChange={(e) => updateParam("status", e.target.value)}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="filter-queueName" className={labelClass}>
            Queue
          </label>
          {searchParams.get("queueName") && (
            <button
              type="button"
              onClick={() => updateParam("queueName", "")}
              className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Clear queue"
            >
              Clear
            </button>
          )}
        </div>
        <select
          id="filter-queueName"
          value={searchParams.get("queueName") ?? ""}
          onChange={(e) => updateParam("queueName", e.target.value)}
          className={inputClass}
        >
          <option value="">All</option>
          {queueOptions.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="filter-startTime" className={labelClass}>
            From date
          </label>
          {searchParams.get("startTime") && (
            <button
              type="button"
              onClick={() => updateParam("startTime", "")}
              className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Clear from date"
            >
              Clear
            </button>
          )}
        </div>
        <input
          id="filter-startTime"
          type="datetime-local"
          value={
            searchParams.get("startTime")
              ? new Date(searchParams.get("startTime")!)
                  .toISOString()
                  .slice(0, 16)
              : ""
          }
          onChange={(e) => {
            const v = e.target.value;
            updateParam("startTime", v ? new Date(v).toISOString() : "");
          }}
          className={inputClass}
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="filter-endTime" className={labelClass}>
            To date
          </label>
          {searchParams.get("endTime") && (
            <button
              type="button"
              onClick={() => updateParam("endTime", "")}
              className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Clear to date"
            >
              Clear
            </button>
          )}
        </div>
        <input
          id="filter-endTime"
          type="datetime-local"
          value={
            searchParams.get("endTime")
              ? new Date(searchParams.get("endTime")!)
                  .toISOString()
                  .slice(0, 16)
              : ""
          }
          onChange={(e) => {
            const v = e.target.value;
            updateParam("endTime", v ? new Date(v).toISOString() : "");
          }}
          className={inputClass}
        />
      </div>

      {customFilters.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] pt-2 border-t border-[var(--border)] mt-4">
            Custom filters
          </h3>
          {customFilters.map((f) => (
            <CustomFilterControl
              key={f.paramKey}
              filter={f}
              value={searchParams.get(f.paramKey) ?? ""}
              onUpdate={(value) => {
                updateParam(f.paramKey, value);
                if (value.trim()) addRecentValue(f.paramKey, value);
              }}
            />
          ))}
        </>
      )}
    </aside>
  );
}

function CustomFilterControl({
  filter,
  value,
  onUpdate,
}: {
  filter: CustomFilterDef;
  value: string;
  onUpdate: (v: string) => void;
}) {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setRecent(getRecentValues(filter.paramKey));
  }, [filter.paramKey]);

  const id = `filter-custom-${filter.paramKey}`;
  const listId = `${id}-list`;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className={labelClass}>
          {filter.label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onUpdate("")}
            className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label={`Clear ${filter.label}`}
          >
            Clear
          </button>
        )}
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder={filter.label}
        list={listId}
        className={inputClass}
      />
      <datalist id={listId}>
        {recent.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
    </div>
  );
}
