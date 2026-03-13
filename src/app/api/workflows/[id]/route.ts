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
    const workflow = await client.getWorkflow(id);
    if (workflow == null) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(workflow);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get workflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
