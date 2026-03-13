import { getClientFromRequest } from "@/lib/api-db";
import { NextResponse } from "next/server";

const OPTIONS_LIMIT = 2000;

export async function GET(request: Request) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const [allWorkflows, queuedWorkflows] = await Promise.all([
      client.listWorkflows({
        limit: OPTIONS_LIMIT,
        sortDesc: true,
      }),
      client.listQueuedWorkflows({
        limit: OPTIONS_LIMIT,
        sortDesc: true,
      }),
    ]);

    const queueNames = new Set<string>();
    const workflowNames = new Set<string>();

    for (const w of allWorkflows) {
      if (w.queueName?.trim()) queueNames.add(w.queueName.trim());
      if (w.workflowName?.trim()) workflowNames.add(w.workflowName.trim());
    }
    for (const w of queuedWorkflows) {
      if (w.queueName?.trim()) queueNames.add(w.queueName.trim());
      if (w.workflowName?.trim()) workflowNames.add(w.workflowName.trim());
    }

    return NextResponse.json({
      queueNames: Array.from(queueNames).sort(),
      workflowNames: Array.from(workflowNames).sort(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load filter options";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
