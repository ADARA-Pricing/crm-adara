/** A short, stable identifier for operators. It is derived from the immutable
 * customer CUID, so legacy and newly created contacts are covered uniformly. */
export function leadId(customerId: string) {
  return `LEAD-${customerId.slice(-8).toUpperCase()}`;
}
