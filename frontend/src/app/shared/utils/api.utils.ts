export function cleanParams(params?: Record<string, unknown>): Record<string, string> {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  );
}
