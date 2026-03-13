import Link from "next/link";
import { DashboardStats } from "@/components/DashboardStats";

export default function DashboardPage() {
  return (
    <div className="relative z-10 p-8 md:p-10">
      <div style={{ animation: "fadeIn 0.5s ease backwards" }}>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">
          Workflow control
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          List, inspect, and manage DBOS durable workflows from one place.
        </p>
      </div>

      <div className="mt-8">
        <DashboardStats />
      </div>

      <div
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        style={{
          animation: "fadeIn 0.5s ease 0.1s backwards",
        }}
      >
        <Link
          href="/workflows"
          className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-muted)]"
        >
          <span className="text-sm font-medium text-[var(--accent)]">
            Workflows
          </span>
          <span className="mt-1 text-lg font-semibold text-[var(--text)]">
            All runs &amp; queued
          </span>
          <span className="mt-2 text-sm text-[var(--text-muted)]">
            Browse execution history or view queued workflows. Filter by status,
            queue, workflow name, and custom filters.
          </span>
        </Link>

        <Link
          href="/schedules"
          className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-muted)]"
        >
          <span className="text-sm font-medium text-[var(--accent)]">
            Schedules
          </span>
          <span className="mt-1 text-lg font-semibold text-[var(--text)]">
            Scheduled workflows
          </span>
          <span className="mt-2 text-sm text-[var(--text-muted)]">
            View and manage cron schedules. Trigger or backfill from here.
          </span>
        </Link>

        <Link
          href="/versions"
          className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-muted)]"
        >
          <span className="text-sm font-medium text-[var(--accent)]">
            Versions
          </span>
          <span className="mt-1 text-lg font-semibold text-[var(--text)]">
            Application versions
          </span>
          <span className="mt-2 text-sm text-[var(--text-muted)]">
            List deployed versions and set which is current for new runs.
          </span>
        </Link>
      </div>

      <p
        className="mt-10 text-sm text-[var(--text-muted)]"
        style={{ animation: "fadeIn 0.5s ease 0.2s backwards" }}
      >
        To replay a workflow in VS Code, use the DBOS extension and the
        workflow ID from the detail page.
      </p>
    </div>
  );
}
