export function isClosingAcknowledgement(value: string | undefined) {
  if (!value) return false;
  const text = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  return new Set([
    "gracias", "muchas gracias", "te agradezco", "gracias igual", "gracias tu igual", "igualmente",
    "ok gracias", "bueno gracias", "dale gracias", "gracias de nuevo", "gracias por todo"
  ]).has(text);
}
