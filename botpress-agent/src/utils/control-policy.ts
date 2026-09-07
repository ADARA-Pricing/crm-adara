export async function checkBotControl(base: string, secret: string, conversationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/conversations/control?conversationId=${encodeURIComponent(conversationId)}`, {
      headers: { 'x-adara-signature': secret }, signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return false
    const control = await response.json() as { botPaused?: boolean }
    return control.botPaused === false
  } catch { return false }
}
