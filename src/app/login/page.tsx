"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Invalid secret");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
      <div
        className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-8 shadow-lg"
        style={{ animation: "fadeIn 0.3s ease" }}
      >
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">
          DBOS Admin
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Enter the admin secret to continue
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="secret" className="sr-only">
              Admin secret
            </label>
            <input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Secret"
              autoComplete="current-password"
              autoFocus
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--error)]" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[var(--radius)] bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--bg)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
