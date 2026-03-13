import { getClientFromRequest } from "@/lib/api-db";
import {
  getCustomFilters,
  workflowMatchesCustomFilter,
} from "@/lib/custom-filters";
import { getWorkflowsInputFromSearchParams } from "@/lib/get-workflows-input";
import type { WorkflowStatus } from "@/types/workflow";
import { NextResponse } from "next/server";

const CUSTOM_FILTER_LIMIT = 2000;

export async function GET(request: Request) {
  const result = await getClientFromRequest(request);
  if (result instanceof NextResponse) return result;
  const { client } = result;
  try {
    const { searchParams } = new URL(request.url);
    const input = getWorkflowsInputFromSearchParams(searchParams);
    const customFilters = getCustomFilters();
    const customValues: Record<string, string> = {};
    for (const f of customFilters) {
      const v = searchParams.get(f.paramKey)?.trim();
      if (v) customValues[f.paramKey] = v;
    }
    if (Object.keys(customValues).length > 0) {
      input.loadInput = true;
      input.limit = input.limit ?? CUSTOM_FILTER_LIMIT;
    }
    let workflows = await client.listWorkflows(input);
    for (const f of customFilters) {
      const value = customValues[f.paramKey];
      if (!value) continue;
      workflows = workflows.filter((w: WorkflowStatus) =>
        workflowMatchesCustomFilter(w.input, value, f.inputFieldNames)
      );
    }
    return NextResponse.json(workflows);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list workflows";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
