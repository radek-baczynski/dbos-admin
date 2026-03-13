"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const COOKIE_NAME = "dbos-database";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setDatabaseCookie(key: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(key)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearDatabaseCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

type DatabaseOption = { key: string; name: string };

type DatabaseContextValue = {
  databases: DatabaseOption[];
  selected: string | null;
  loading: boolean;
  error: string | null;
  selectDatabase: (key: string) => void;
  clearSelection: () => void;
  refetch: () => Promise<void>;
};

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [databases, setDatabases] = useState<DatabaseOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/databases");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setDatabases(data.databases);
      setSelected(
        data.selected && data.databases.some((d: DatabaseOption) => d.key === data.selected)
          ? data.selected
          : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load databases");
      setDatabases([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const selectDatabase = useCallback((key: string) => {
    setDatabaseCookie(key);
    setSelected(key);
  }, []);

  const clearSelection = useCallback(() => {
    clearDatabaseCookie();
    setSelected(null);
  }, []);

  const value: DatabaseContextValue = {
    databases,
    selected,
    loading,
    error,
    selectDatabase,
    clearSelection,
    refetch,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error("useDatabase must be used within DatabaseProvider");
  }
  return ctx;
}
