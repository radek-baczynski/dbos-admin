const PREFIX = "DBOS_DATABASE_";
const COOKIE_NAME = "dbos-database";

export type DatabaseOption = { key: string; name: string };

/**
 * Reads available databases from env.
 * Supports DBOS_DATABASE_<Key>=postgresql://... (e.g. DBOS_DATABASE_Astraia=...).
 */
export function getAvailableDatabases(): DatabaseOption[] {
  const options: DatabaseOption[] = [];
  const seen = new Set<string>();

  for (const [envKey, url] of Object.entries(process.env)) {
    if (!url || typeof url !== "string") continue;
    if (envKey.startsWith(PREFIX)) {
      const key = envKey.slice(PREFIX.length).trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        options.push({ key, name: key });
      }
    }
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

export function getDatabaseUrl(key: string): string | undefined {
  return process.env[`${PREFIX}${key}`];
}

/**
 * Parses the selected database key from the request cookie.
 */
export function getSelectedDatabaseKey(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : null;
}

export { COOKIE_NAME as DBOS_DATABASE_COOKIE_NAME };
