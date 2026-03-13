"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/workflows", label: "Workflows" },
  { href: "/schedules", label: "Schedules" },
  { href: "/versions", label: "Versions" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { selected, clearSelection } = useDatabase();
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => setAuthRequired(Boolean(data.authRequired)))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav
      className="fixed left-0 top-0 z-10 h-full w-[var(--nav-width)] border-r border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur-sm"
      aria-label="Main"
    >
      <div className="flex h-full flex-col pt-8">
        <div className="px-4 pb-6">
          <Link
            href="/"
            className="block font-semibold tracking-tight text-[var(--text)] no-underline transition hover:text-[var(--accent)]"
          >
            DBOS Admin
          </Link>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Workflow control
          </p>
          {selected != null && (
            <div className="mt-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-muted)]/50 px-3 py-2">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Database
              </p>
              <p className="truncate text-sm font-medium text-[var(--text)]" title={selected}>
                {selected}
              </p>
              <button
                type="button"
                onClick={clearSelection}
                className="mt-1.5 text-xs text-[var(--accent)] hover:underline"
              >
                Change…
              </button>
            </div>
          )}
        </div>
        <ul className="flex flex-col gap-0.5 px-3">
          {navItems.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`block rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition
                    ${isActive ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"}`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        {authRequired && (
          <div className="mt-auto border-t border-[var(--border)] p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-[var(--radius)] px-3 py-2.5 text-left text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
