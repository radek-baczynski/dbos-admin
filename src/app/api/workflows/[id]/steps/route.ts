import { getClientFromRequest } from "@/lib/api-db";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext
) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const { id } = await context.params;
    const steps = await client.listWorkflowSteps(id);
    if (steps == null) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(steps);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list workflow steps";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
