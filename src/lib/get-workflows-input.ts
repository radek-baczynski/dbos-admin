import type { GetWorkflowsInput } from "@dbos-inc/dbos-sdk";

function parseOptionalInt(s: string | null): number | undefined {
  if (s == null) return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
}

function parseOptionalBool(s: string | null): boolean | undefined {
  if (s == null) return undefined;
  const lower = s.toLowerCase();
  if (lower === "true" || lower === "1") return true;
  if (lower === "false" || lower === "0") return false;
  return undefined;
}

function oneOrMany(s: string | string[] | null): string | string[] | undefined {
  if (s == null) return undefined;
  if (Array.isArray(s)) return s.length ? s : undefined;
  return s;
}

export function getWorkflowsInputFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): GetWorkflowsInput {
  const get = (key: string): string | null => {
    const v = searchParams instanceof URLSearchParams
      ? searchParams.get(key)
      : searchParams[key];
    return Array.isArray(v) ? v[0] ?? null : v ?? null;
  };
  const getAll = (key: string): string[] | undefined => {
    if (searchParams instanceof URLSearchParams) {
      const a = searchParams.getAll(key);
      return a.length ? a : undefined;
    }
    const v = searchParams[key];
    if (Array.isArray(v)) return v.length ? v : undefined;
    return v ? [v] : undefined;
  };

  const limit = parseOptionalInt(get("limit"));
  const offset = parseOptionalInt(get("offset"));
  const statusRaw = oneOrMany(getAll("status") ?? get("status"));
  // Normalize legacy "queued" to DBOS status ENQUEUED; then build status for SDK
  const normalized =
    statusRaw == null
      ? undefined
      : Array.isArray(statusRaw)
        ? statusRaw.map((s) => (s === "queued" ? "ENQUEUED" : s))
        : statusRaw === "queued"
          ? "ENQUEUED"
          : statusRaw;
  const status = normalized != null && normalized !== "" ? normalized : undefined;
  const statusFiltered =
    status != null &&
    (Array.isArray(status) ? status.length > 0 : true)
      ? status
      : undefined;
  const workflowName = oneOrMany(getAll("workflowName") ?? get("workflowName"));
  const startTime = get("startTime") ?? undefined;
  const endTime = get("endTime") ?? undefined;
  const queueName = oneOrMany(getAll("queueName") ?? get("queueName"));
  const sortDesc = parseOptionalBool(get("sortDesc"));
  const loadInput = parseOptionalBool(get("loadInput"));
  const loadOutput = parseOptionalBool(get("loadOutput"));
  const workflowIdPrefix = oneOrMany(getAll("workflow_id_prefix") ?? get("workflow_id_prefix"));
  const q = get("q")?.trim();

  const input: GetWorkflowsInput = {};
  if (limit != null) input.limit = limit;
  if (offset != null) input.offset = offset;
  if (statusFiltered != null)
    input.status = statusFiltered as GetWorkflowsInput["status"];
  if (workflowName != null) input.workflowName = workflowName;
  if (startTime != null) input.startTime = startTime;
  if (endTime != null) input.endTime = endTime;
  if (queueName != null) input.queueName = queueName;
  if (sortDesc != null) input.sortDesc = sortDesc;
  if (loadInput != null) input.loadInput = loadInput;
  if (loadOutput != null) input.loadOutput = loadOutput;
  if (workflowIdPrefix != null) input.workflow_id_prefix = workflowIdPrefix;

  if (q && !workflowIdPrefix && !input.workflowName) {
    const looksLikeUuid =
      /^[0-9a-fA-F-]{8,}$/.test(q) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(q);
    if (looksLikeUuid) {
      input.workflow_id_prefix = q;
    } else {
      input.workflowName = q;
    }
  }

  return input;
}
