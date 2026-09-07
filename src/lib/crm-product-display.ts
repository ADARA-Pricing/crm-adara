/** CRM presentation only; does not change catalog values or bot contracts. */
export function productMoneyInput(value?: number) {
  return value === undefined ? "" : String(value / 100);
}

export function productViewFilters(raw: Record<string, string | string[] | undefined>) {
  const search = typeof raw.q === "string" ? raw.q.trim().slice(0, 120) : "";
  const active = raw.active === "yes" || raw.active === "no" ? raw.active : "";
  return { search, active };
}
