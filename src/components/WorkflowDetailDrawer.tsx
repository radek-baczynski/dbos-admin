"use client";

interface WorkflowDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function WorkflowDetailDrawer({
  open,
  onClose,
  children,
}: WorkflowDetailDrawerProps) {
  if (!open) return null;

  return (
    <>
      <div
        role="presentation"
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Workflow details"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[min(900px,90vw)] flex-col border-l border-[var(--border)] bg-[var(--bg)] shadow-2xl transition-transform duration-200 ease-out data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full"
        data-state={open ? "open" : "closed"}
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-end border-b border-[var(--border)] p-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius)] p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}
