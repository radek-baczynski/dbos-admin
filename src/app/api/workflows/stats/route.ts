import { getClientFromRequest } from "@/lib/api-db";
import { NextResponse } from "next/server";

const STATS_LIMIT = 5000;

/** Per-workflow-name stats: status -> count (includes ENQUEUED from queued list) */
export type WorkflowNameStats = Record<string, Record<string, number>>;

function buildStats(executed: { workflowName?: string; status?: string }[], queued: { workflowName?: string }[]): WorkflowNameStats {
  const byWorkflowName: WorkflowNameStats = {};
  function add(name: string, status: string, count = 1) {
    const key = name || "(unnamed)";
    if (!byWorkflowName[key]) byWorkflowName[key] = {};
    byWorkflowName[key][status] = (byWorkflowName[key][status] ?? 0) + count;
  }
  for (const w of executed) {
    add(w.workflowName ?? "(unnamed)", (w as { status?: string }).status ?? "UNKNOWN");
  }
  for (const w of queued) {
    add(w.workflowName ?? "(unnamed)", "ENQUEUED");
  }
  return byWorkflowName;
}

export async function GET(request: Request) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const now = Date.now();
    const last24hEpoch = now - 24 * 60 * 60 * 1000;

    const [executed, queued] = await Promise.all([
      client.listWorkflows({
        limit: STATS_LIMIT,
        sortDesc: true,
      }),
      client.listQueuedWorkflows({
        limit: STATS_LIMIT,
        sortDesc: true,
      }),
    ]);

    const executedLast24h = executed.filter(
      (w: { createdAt?: number }) => (w.createdAt ?? 0) >= last24hEpoch
    );

    const total = buildStats(executed, queued);
    const last24h = buildStats(executedLast24h, queued);

    return NextResponse.json({ total, last24h });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load workflow stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
