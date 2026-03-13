const PREFIX = "DBOS_CUSTOM_FILTER_";

export interface CustomFilterDef {
  paramKey: string;
  label: string;
  inputFieldNames: string[];
}

function envKeyToParamKey(key: string): string {
  const suffix = key.slice(PREFIX.length).trim();
  if (!suffix) return "";
  return suffix
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^([a-z])/, (_, c) => c);
}

function paramKeyToLabel(paramKey: string): string {
  if (!paramKey) return "";
  const withSpaces = paramKey.replace(/([A-Z])/g, " $1").trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export function getCustomFilters(): CustomFilterDef[] {
  const filters: CustomFilterDef[] = [];
  if (typeof process === "undefined" || !process.env) return filters;
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(PREFIX) || !value || typeof value !== "string")
      continue;
    const paramKey = envKeyToParamKey(key);
    if (!paramKey) continue;
    const inputFieldNames = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (inputFieldNames.length === 0) continue;
    filters.push({
      paramKey,
      label: paramKeyToLabel(paramKey),
      inputFieldNames,
    });
  }
  return filters;
}

export function getCustomFilterParamKeys(): string[] {
  return getCustomFilters().map((f) => f.paramKey);
}

/**
 * Check if a workflow's input matches the given custom filter value.
 * Input is typically an array of args; we look for the value in any of the configured field names
 * (shallow on objects, or in array elements).
 */
export function workflowMatchesCustomFilter(
  input: unknown[] | undefined,
  filterValue: string,
  inputFieldNames: string[]
): boolean {
  if (!input || !filterValue.trim()) return true;
  const value = filterValue.trim();
  const collectValues = (obj: unknown): unknown[] => {
    if (obj == null) return [];
    if (Array.isArray(obj)) return obj.flatMap(collectValues);
    if (typeof obj === "object") {
      return Object.entries(obj).flatMap(([k, v]) =>
        inputFieldNames.includes(k) ? [v] : collectValues(v)
      );
    }
    return [obj];
  };
  const values = input.flatMap(collectValues);
  return values.some(
    (v) => v != null && String(v) === value
  );
}
