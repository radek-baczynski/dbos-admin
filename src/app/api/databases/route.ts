import { NextResponse } from "next/server";
import {
  getAvailableDatabases,
  getSelectedDatabaseKey,
} from "@/lib/databases";

export async function GET(request: Request) {
  const databases = getAvailableDatabases();
  const selected = getSelectedDatabaseKey(request);
  return NextResponse.json({
    databases: databases.map(({ key, name }) => ({ key, name })),
    selected: selected && databases.some((d) => d.key === selected) ? selected : null,
  });
}
