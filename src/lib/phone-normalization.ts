/** Comparison key only. The original phone is never replaced or sent anywhere. */
export function normalizedPhoneKey(value: string | null | undefined) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return null;
  const hasArgentinaPrefix = digits.startsWith("54") && digits.length >= 12;
  let local = hasArgentinaPrefix ? digits.slice(2) : digits;
  const hasArgentinaMobilePrefix = local.startsWith("9") && local.length === 11;
  if (hasArgentinaMobilePrefix) local = local.slice(1);
  return hasArgentinaPrefix || hasArgentinaMobilePrefix || local.length === 10 ? `ar:${local}` : `intl:${digits}`;
}
