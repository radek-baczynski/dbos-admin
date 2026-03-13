"use client";

import { useDatabase } from "@/contexts/DatabaseContext";

export function DatabaseSelector() {
  const { databases, selectDatabase } = useDatabase();

  const handleSelect = (key: string) => {
    selectDatabase(key);
  };

  return (
    <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center p-8">
      <div
        className="w-full max-w-md space-y-6"
        style={{ animation: "fadeIn 0.4s ease backwards" }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            Select database
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Choose a DBOS system database to view workflows and queues.
          </p>
        </div>
        <ul className="space-y-2">
          {databases.map((db, i) => (
            <li
              key={db.key}
              style={{ animation: `fadeIn 0.3s ease ${0.05 + i * 0.05}s backwards` }}
            >
              <button
                type="button"
                onClick={() => handleSelect(db.key)}
                className="group flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)]/15 text-[var(--accent)]">
                  DB
                </span>
                <span className="font-medium text-[var(--text)]">{db.name}</span>
                <span className="ml-auto text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100">
                  Use →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
