import { getClientFromRequest } from "@/lib/api-db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const latest = await client.getLatestApplicationVersion();
    return NextResponse.json(latest);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get latest application version";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const body = await request.json();
    const { versionName } = body;
    if (typeof versionName !== "string" || !versionName.trim()) {
      return NextResponse.json(
        { error: "versionName is required" },
        { status: 400 }
      );
    }
    await client.setLatestApplicationVersion(versionName.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to set latest application version";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
