"use client";

import { useDatabase } from "@/contexts/DatabaseContext";
import { DatabaseSelector } from "./DatabaseSelector";

export function DatabaseGuard({ children }: { children: React.ReactNode }) {
  const { databases, selected, loading, error } = useDatabase();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-[var(--text-muted)]">Loading…</p>
      </div>
    );
  }

  if (error && databases.length === 0) {
    return (
      <div className="relative z-10 p-8 md:p-10">
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Add at least one database to .env.local, e.g.:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-[var(--radius)] bg-[var(--bg-muted)] p-3 font-mono text-xs text-[var(--text-muted)]">
          DBOS_DATABASE_Astraia=postgresql://user:pass@localhost:5432/dbos_astraia
        </pre>
      </div>
    );
  }

  if (selected == null) {
    return <DatabaseSelector />;
  }

  return <>{children}</>;
}
