"use client";

import { useCallback, useEffect, useState } from "react";
import type { VersionInfo } from "@/types/version";

export default function VersionsPage() {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [latest, setLatest] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingLatest, setSettingLatest] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, latestRes] = await Promise.all([
        fetch("/api/versions"),
        fetch("/api/versions/latest"),
      ]);
      if (!listRes.ok) {
        const d = await listRes.json().catch(() => ({}));
        throw new Error(d.error || listRes.statusText);
      }
      const list = await listRes.json();
      setVersions(list);
      if (latestRes.ok) {
        const latestData = await latestRes.json();
        setLatest(latestData);
      } else {
        setLatest(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load versions");
      setVersions([]);
      setLatest(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const setAsLatest = async (versionName: string) => {
    setSettingLatest(versionName);
    setError(null);
    try {
      const res = await fetch("/api/versions/latest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionName }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || res.statusText);
      }
      await fetchVersions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set latest version");
    } finally {
      setSettingLatest(null);
    }
  };

  const latestName = latest?.versionName ?? null;

  return (
    <div className="relative z-10 p-8 md:p-10">
      <div style={{ animation: "fadeIn 0.4s ease backwards" }}>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          Application versions
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Deployed versions. Set which version is current (used for new workflow runs).
        </p>
      </div>

      {error && (
        <div
          className="mt-4 rounded-[var(--radius)] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      <div
        className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)]"
        style={{ animation: "fadeIn 0.4s ease 0.05s backwards" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
            Loading…
          </div>
        ) : versions.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)]">
            No application versions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                    Version name
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                    Version ID
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                    Current
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-muted)]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => {
                  const isLatest = v.versionName === latestName;
                  return (
                    <tr
                      key={v.versionId}
                      className="border-b border-[var(--border)]/60 transition hover:bg-[var(--bg-muted)]"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text)]">
                        {v.versionName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                        {v.versionId}
                      </td>
                      <td className="px-4 py-3">
                        {isLatest ? (
                          <span className="inline-flex items-center rounded-full bg-[var(--success)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--success)]">
                            Current
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isLatest && (
                          <button
                            type="button"
                            disabled={settingLatest != null}
                            onClick={() => setAsLatest(v.versionName)}
                            className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:opacity-50"
                          >
                            {settingLatest === v.versionName
                              ? "Setting…"
                              : "Set as latest"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && versions.length > 0 && (
        <button
          type="button"
          onClick={() => fetchVersions()}
          className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)]"
        >
          Refresh
        </button>
      )}
    </div>
  );
}
