function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

/** Wildcard channels supply unknown payloads: validate without assuming a channel. */
export function incomingMessage(value: unknown) {
  const message = object(value)
  if (!message || typeof message.type !== 'string') return undefined
  const payload = object(message.payload)
  return {
    type: message.type,
    userId: typeof message.userId === 'string' ? message.userId : undefined,
    text: typeof payload?.text === 'string' ? payload.text : undefined,
  }
}

export function whatsappPhoneFromConversation(value: unknown): string | undefined {
  const tags = object(object(value)?.tags)
  const phone = tags?.['whatsapp:userPhone']
  return typeof phone === 'string' && phone.trim() ? phone.trim() : undefined
}
