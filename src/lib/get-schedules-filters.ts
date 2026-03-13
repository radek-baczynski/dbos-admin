function oneOrMany(
  searchParams: URLSearchParams,
  key: string
): string | string[] | undefined {
  const all = searchParams.getAll(key);
  if (all.length === 0) return undefined;
  if (all.length === 1) return all[0];
  return all;
}

export function getSchedulesFiltersFromSearchParams(searchParams: URLSearchParams) {
  const filters: {
    status?: string | string[];
    workflowName?: string | string[];
    scheduleNamePrefix?: string | string[];
  } = {};
  const status = oneOrMany(searchParams, "status");
  if (status != null) filters.status = status;
  const workflowName = oneOrMany(searchParams, "workflowName");
  if (workflowName != null) filters.workflowName = workflowName;
  const scheduleNamePrefix = oneOrMany(searchParams, "scheduleNamePrefix");
  if (scheduleNamePrefix != null) filters.scheduleNamePrefix = scheduleNamePrefix;
  return filters;
}
