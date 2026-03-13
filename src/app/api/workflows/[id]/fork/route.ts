import { getClientFromRequest } from "@/lib/api-db";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

type ForkBody = {
  startStep: number;
  newWorkflowID?: string;
  applicationVersion?: string;
  timeoutMS?: number;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const { id } = await context.params;
    const body = (await request.json()) as ForkBody;
    const { startStep, newWorkflowID, applicationVersion, timeoutMS } = body;
    if (typeof startStep !== "number") {
      return NextResponse.json(
        { error: "startStep is required and must be a number" },
        { status: 400 }
      );
    }
    const newId = await client.forkWorkflow(id, startStep, {
      newWorkflowID,
      applicationVersion,
      timeoutMS,
    });
    return NextResponse.json({ workflowID: newId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fork workflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
