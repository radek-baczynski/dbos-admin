import { getClientFromRequest } from "@/lib/api-db";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ name: string }> };

export async function GET(request: Request, context: RouteContext) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const { name } = await context.params;
    const scheduleName = decodeURIComponent(name);
    const schedule = await client.getSchedule(scheduleName);
    if (schedule == null) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(schedule);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const { name } = await context.params;
    const scheduleName = decodeURIComponent(name);
    await client.deleteSchedule(scheduleName);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
