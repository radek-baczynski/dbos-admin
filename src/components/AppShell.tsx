"use client";

import { usePathname } from "next/navigation";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Nav } from "@/components/Nav";
import { DatabaseGuard } from "@/components/DatabaseGuard";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { selected } = useDatabase();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {selected != null && <Nav />}
      <main
        className="flex-1 min-w-0"
        style={
          selected != null
            ? { paddingLeft: "var(--nav-width)" }
            : undefined
        }
      >
        <DatabaseGuard>{children}</DatabaseGuard>
      </main>
    </div>
  );
}
