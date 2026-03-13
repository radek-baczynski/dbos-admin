import { getClientFromRequest } from "@/lib/api-db";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: RouteContext
) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const { id } = await context.params;
    await client.resumeWorkflow(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resume workflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
