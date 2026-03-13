const statusClass: Record<string, string> = {
  SUCCESS: "status-success",
  ERROR: "status-error",
  PENDING: "status-pending",
  ENQUEUED: "status-enqueued",
  CANCELLED: "status-cancelled",
  MAX_RECOVERY_ATTEMPTS_EXCEEDED: "status-max_recovery_attempts_exceeded",
};

export function StatusBadge({ status }: { status: string }) {
  const c = statusClass[status] ?? "text-[var(--text-muted)]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${c}`}
      title={status}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}
