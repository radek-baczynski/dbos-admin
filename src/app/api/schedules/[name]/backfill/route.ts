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
    const body = await request.json();
    const { start, end } = body;
    if (start == null || end == null) {
      return NextResponse.json(
        { error: "start and end (ISO date strings) are required" },
        { status: 400 }
      );
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "start and end must be valid ISO date strings" },
        { status: 400 }
      );
    }
    const handles = await client.backfillSchedule(scheduleName, startDate, endDate);
    const workflowIDs = handles.map((h) => h.workflowID);
    return NextResponse.json({ workflowIDs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to backfill schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
