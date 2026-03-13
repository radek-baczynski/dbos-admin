import { NextResponse } from "next/server";
import type { DBOSClient } from "@dbos-inc/dbos-sdk";
import { getDBOSClient } from "@/lib/dbos";
import {
  getAvailableDatabases,
  getDatabaseUrl,
  getSelectedDatabaseKey,
} from "@/lib/databases";

export type DbRequestResult =
  | { client: DBOSClient; databaseKey: string }
  | NextResponse;

/**
 * Resolves the selected database from the request cookie and returns the DBOS client.
 * If no database is selected or the key is invalid, returns a 403 NextResponse.
 */
export async function getClientFromRequest(
  request: Request
): Promise<DbRequestResult> {
  const databases = getAvailableDatabases();
  if (databases.length === 0) {
    return NextResponse.json(
      {
        error:
          "No databases configured. Add DBOS_DATABASE_<Name>=postgresql://... to .env.local",
      },
      { status: 503 }
    );
  }
  const key = getSelectedDatabaseKey(request);
  if (!key) {
    return NextResponse.json(
      { error: "No database selected. Select a database to continue." },
      { status: 403 }
    );
  }
  if (!getDatabaseUrl(key)) {
    return NextResponse.json(
      {
        error: `Database "${key}" is not configured. Add DBOS_DATABASE_${key}=postgresql://... to .env.local.`,
      },
      { status: 400 }
    );
  }
  try {
    const client = await getDBOSClient(key);
    return { client, databaseKey: key };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database connection failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
