import { getClientFromRequest } from "@/lib/api-db";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ name: string }> };

export async function POST(request: Request, context: RouteContext) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const { name } = await context.params;
    const scheduleName = decodeURIComponent(name);
    const handle = await client.triggerSchedule(scheduleName);
    const workflowID = handle.workflowID;
    return NextResponse.json({ workflowID });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to trigger schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
