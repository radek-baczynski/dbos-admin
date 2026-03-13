import { getClientFromRequest } from "@/lib/api-db";
import { getSchedulesFiltersFromSearchParams } from "@/lib/get-schedules-filters";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const { searchParams } = new URL(request.url);
    const filters = getSchedulesFiltersFromSearchParams(searchParams);
    const schedules = await client.listSchedules(filters);
    return NextResponse.json(schedules);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list schedules";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const body = await request.json();
    const {
      scheduleName,
      workflowName,
      workflowClassName,
      schedule,
      context,
    } = body;
    if (typeof scheduleName !== "string" || typeof workflowName !== "string" || typeof schedule !== "string") {
      return NextResponse.json(
        { error: "scheduleName, workflowName, and schedule are required" },
        { status: 400 }
      );
    }
    await client.createSchedule({
      scheduleName,
      workflowName,
      workflowClassName: typeof workflowClassName === "string" ? workflowClassName : undefined,
      schedule,
      context,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
