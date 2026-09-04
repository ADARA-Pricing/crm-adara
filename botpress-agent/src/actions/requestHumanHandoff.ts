import { Action, configuration, context, secrets, z } from '@botpress/runtime'

export const requestHumanHandoff = new Action({
  name: 'requestHumanHandoff',
  description: 'Registra una derivación prioritaria al equipo humano de Adara y crea una tarea de seguimiento en el CRM.',
  input: z.object({
    reason: z.enum(['human_request', 'coverage_review', 'special_case', 'out_of_hours']),
    summary: z.string().min(3).max(500).describe('Resumen breve de lo que necesita la persona y los datos útiles ya compartidos.'),
  }),
  output: z.object({ taskId: z.string(), queued: z.boolean() }),
  async handler({ input }) {
    const conversation = context.get('conversation', { optional: true })
    if (!conversation?.id) throw new Error('No se encontró la conversación para derivar.')
    const crmApiBaseUrl = configuration.crmApiBaseUrl || 'https://crm-adara.vercel.app'
    const response = await fetch(`${crmApiBaseUrl.replace(/\/$/, '')}/api/handoffs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-adara-signature': secrets.CRM_WEBHOOK_SECRET },
      body: JSON.stringify({
        conversationId: conversation.id,
        phone: conversation.tags['whatsapp:userPhone'],
        reason: input.reason.toUpperCase(),
        summary: input.summary,
      }),
    })
    if (!response.ok) throw new Error(`No se pudo derivar al equipo (HTTP ${response.status})`)
    return await response.json()
  },
})
