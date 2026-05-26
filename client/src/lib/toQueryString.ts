export function toQueryString(query: Record<string, unknown>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  const s = params.toString();
  return s ? `?${s}` : '';
}
