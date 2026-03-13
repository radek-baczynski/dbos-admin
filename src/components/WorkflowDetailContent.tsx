"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { WorkflowStatus, StepInfo } from "@/types/workflow";

function formatTime(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

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

const ACTIVE_STATUSES = ["PENDING", "ENQUEUED"];
const RESUMABLE_STATUSES = ["CANCELLED", "MAX_RECOVERY_ATTEMPTS_EXCEEDED"];

export interface WorkflowDetailContentProps {
  workflowId: string;
  onClose?: () => void;
  onOpenWorkflow?: (id: string) => void;
}

export function WorkflowDetailContent({
  workflowId,
  onClose,
  onOpenWorkflow,
}: WorkflowDetailContentProps) {
  const id = workflowId;
  const [workflow, setWorkflow] = useState<WorkflowStatus | null>(null);
  const [steps, setSteps] = useState<StepInfo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [forkingStep, setForkingStep] = useState<number | null>(null);
  const [forkResult, setForkResult] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [wfRes, stepsRes] = await Promise.all([
        fetch(`/api/workflows/${id}`),
        fetch(`/api/workflows/${id}/steps`),
      ]);
      if (!wfRes.ok) {
        const d = await wfRes.json().catch(() => ({}));
        throw new Error(d.error || wfRes.statusText);
      }
      const wf = await wfRes.json();
      setWorkflow(wf);
      if (stepsRes.ok) {
        const st = await stepsRes.json();
        setSteps(st);
      } else {
        setSteps([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load workflow");
      setWorkflow(null);
      setSteps(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const doAction = async (
    action: "cancel" | "resume",
    label: string
  ) => {
    setActionLoading(label);
    try {
      const res = await fetch(`/api/workflows/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || res.statusText);
      }
      await fetchDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const doRetry = async () => {
    setActionLoading("Retry");
    setForkResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/workflows/${id}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startStep: 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setForkResult(data.workflowID);
      if (onOpenWorkflow) {
        onOpenWorkflow(data.workflowID);
      } else {
        window.location.href = `/workflows?detail=${encodeURIComponent(data.workflowID)}`;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to retry");
    } finally {
      setActionLoading(null);
    }
  };

  const doFork = async (step: number) => {
    setForkingStep(step);
    setForkResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/workflows/${id}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startStep: step }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setForkResult(data.workflowID);
      if (onOpenWorkflow) {
        onOpenWorkflow(data.workflowID);
      } else {
        window.location.href = `/workflows?detail=${encodeURIComponent(data.workflowID)}`;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fork");
    } finally {
      setForkingStep(null);
    }
  };

  const openWorkflowLink = (targetId: string) => {
    if (onOpenWorkflow) {
      return (
        <button
          type="button"
          onClick={() => onOpenWorkflow(targetId)}
          className="font-mono text-xs text-[var(--accent)] hover:underline"
        >
          {targetId}
        </button>
      );
    }
    return (
      <a
        href={`/workflows?detail=${encodeURIComponent(targetId)}`}
        className="font-mono text-xs text-[var(--accent)] hover:underline"
      >
        {targetId}
      </a>
    );
  };

  if (loading && !workflow) {
    return (
      <div className="p-6">
        <div className="py-16 text-center text-[var(--text-muted)]">
          Loading workflow…
        </div>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="p-6">
        <div
          className="rounded-[var(--radius)] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-sm text-[var(--accent)] hover:underline"
          >
            ← Close
          </button>
        )}
      </div>
    );
  }

  const w = workflow!;
  const canCancel = ACTIVE_STATUSES.includes(w.status);
  const canResume = RESUMABLE_STATUSES.includes(w.status);

  return (
    <div className="p-6">
      <div style={{ animation: "fadeIn 0.4s ease backwards" }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            ← Close
          </button>
        )}
        <h1 className="mt-4 font-mono text-lg font-semibold text-[var(--text)]">
          {w.workflowID}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {w.workflowClassName && `${w.workflowClassName}.`}
          {w.workflowName}
        </p>
        <div className="mt-2">
          <StatusBadge status={w.status} />
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

      {/* Actions */}
      <div
        className="mt-6 flex flex-wrap items-center gap-3"
        style={{ animation: "fadeIn 0.4s ease 0.05s backwards" }}
      >
        {canCancel && (
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={() => doAction("cancel", "Cancel")}
            className="rounded-[var(--radius)] border border-[var(--error)]/50 bg-[var(--error)]/10 px-4 py-2 text-sm font-medium text-[var(--error)] transition hover:bg-[var(--error)]/20 disabled:opacity-50"
          >
            {actionLoading === "Cancel" ? "Cancelling…" : "Cancel workflow"}
          </button>
        )}
        {canResume && (
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={() => doAction("resume", "Resume")}
            className="rounded-[var(--radius)] bg-[var(--success)]/20 px-4 py-2 text-sm font-medium text-[var(--success)] transition hover:bg-[var(--success)]/30 disabled:opacity-50"
          >
            {actionLoading === "Resume" ? "Resuming…" : "Resume workflow"}
          </button>
        )}
        <button
          type="button"
          disabled={!!actionLoading}
          onClick={doRetry}
          className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:opacity-50"
          title="Replay workflow from the beginning (fork from step 0)"
        >
          {actionLoading === "Retry" ? "Retrying…" : "Retry"}
        </button>
        <button
          type="button"
          onClick={() => fetchDetail()}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)]"
        >
          Refresh
        </button>
      </div>

      {forkResult && (
        <p className="mt-2 text-sm text-[var(--success)]">
          Forked to workflow {openWorkflowLink(forkResult)}
        </p>
      )}

      {/* Metadata */}
      <section
        className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
        style={{ animation: "fadeIn 0.4s ease 0.1s backwards" }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Metadata
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--text-muted)]">Created</dt>
            <dd className="font-mono text-sm text-[var(--text)]">
              {formatTime(w.createdAt)}
            </dd>
          </div>
          {w.updatedAt != null && (
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Updated</dt>
              <dd className="font-mono text-sm text-[var(--text)]">
                {formatTime(w.updatedAt)}
              </dd>
            </div>
          )}
          {w.queueName != null && (
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Queue</dt>
              <dd className="text-sm text-[var(--text)]">{w.queueName}</dd>
            </div>
          )}
          {w.applicationVersion != null && (
            <div>
              <dt className="text-xs text-[var(--text-muted)]">App version</dt>
              <dd className="font-mono text-sm text-[var(--text)]">
                {w.applicationVersion}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Input / Output / Error */}
      <section
        className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
        style={{ animation: "fadeIn 0.4s ease 0.15s backwards" }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Input / Output / Error
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-xs font-medium text-[var(--text-muted)]">
              Input
            </h3>
            <JsonBlock data={w.input} />
          </div>
          <div>
            <h3 className="text-xs font-medium text-[var(--text-muted)]">
              Output
            </h3>
            <JsonBlock data={w.output} />
          </div>
          {w.error != null && (
            <div>
              <h3 className="text-xs font-medium text-[var(--error)]">Error</h3>
              <JsonBlock data={w.error} />
            </div>
          )}
        </div>
      </section>

      {/* Steps */}
      <section
        className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
        style={{ animation: "fadeIn 0.4s ease 0.2s backwards" }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Steps
        </h2>
        {steps == null || steps.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            No steps recorded.
          </p>
        ) : (() => {
          const visibleSteps = steps.filter((s) => s.name !== "Form");
          return visibleSteps.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              No steps recorded.
            </p>
          ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 pr-4 font-medium text-[var(--text-muted)]">
                    #
                  </th>
                  <th className="py-2 pr-4 font-medium text-[var(--text-muted)]">
                    Name
                  </th>
                  <th className="py-2 pr-4 font-medium text-[var(--text-muted)]">
                    Started
                  </th>
                  <th className="py-2 pr-4 font-medium text-[var(--text-muted)]">
                    Completed
                  </th>
                  <th className="py-2 pr-4 font-medium text-[var(--text-muted)]">
                    Child workflow
                  </th>
                  <th className="py-2 font-medium text-[var(--text-muted)]">
                    Output / Error
                  </th>
                  <th className="w-16 py-2 font-medium text-[var(--text-muted)]">
                    Fork
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleSteps.map((s) => (
                  <tr
                    key={s.functionID}
                    className="border-b border-[var(--border)]/60"
                  >
                    <td className="py-2 pr-4 font-mono text-[var(--text-muted)]">
                      {s.functionID}
                    </td>
                    <td className="py-2 pr-4 font-medium text-[var(--text)]">
                      {s.name}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-[var(--text-muted)]">
                      {s.startedAtEpochMs
                        ? formatTime(s.startedAtEpochMs)
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-[var(--text-muted)]">
                      {s.completedAtEpochMs
                        ? formatTime(s.completedAtEpochMs)
                        : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {s.childWorkflowID
                        ? openWorkflowLink(s.childWorkflowID)
                        : "—"}
                    </td>
                    <td className="py-2">
                      {s.error != null ? (
                        <span className="text-[var(--error)]">
                          {s.error?.message ?? String(s.error)}
                        </span>
                      ) : (
                        <JsonBlock data={s.output} />
                      )}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        disabled={forkingStep !== null}
                        onClick={() => doFork(s.functionID)}
                        className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:opacity-50"
                        title={`Fork from step ${s.functionID}`}
                      >
                        {forkingStep === s.functionID ? "Forking…" : "Fork"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          );
        })()}
      </section>
    </div>
  );
}
