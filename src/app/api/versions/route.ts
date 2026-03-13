import { getClientFromRequest } from "@/lib/api-db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const versions = await client.listApplicationVersions();
    return NextResponse.json(versions);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list application versions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
