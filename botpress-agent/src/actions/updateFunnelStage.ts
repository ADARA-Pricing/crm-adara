import { Action, configuration, context, secrets, z } from '@botpress/runtime'

export const updateFunnelStage = new Action({
  name: 'updateFunnelStage',
  description: 'Actualiza una etapa comercial duradera en el CRM. Usar únicamente cuando la persona muestre una señal clara que justifique el cambio; no usar por cada mensaje.',
  input: z.object({
    stage: z.enum(['first_contact', 'interested', 'very_interested', 'coordinate_delivery', 'local_pickup', 'abandoned']),
    note: z.string().max(240).optional().describe('Motivo comercial corto, interno y objetivo.'),
    fullName: z.string().min(2).optional(),
    phone: z.string().min(6).optional(),
  }),
  output: z.object({ customerId: z.string(), stage: z.string() }),
  async handler({ input }) {
    const conversation = context.get('conversation', { optional: true })
    if (!conversation?.id) throw new Error('No se encontró la conversación para actualizar el embudo.')
    const crmApiBaseUrl = configuration.crmApiBaseUrl || 'https://crm-adara.vercel.app'
    const stageMap = { first_contact: 'FIRST_CONTACT', interested: 'INTERESTED', very_interested: 'VERY_INTERESTED', coordinate_delivery: 'COORDINATE_DELIVERY', local_pickup: 'LOCAL_PICKUP', abandoned: 'ABANDONED' } as const
    const response = await fetch(`${crmApiBaseUrl.replace(/\/$/, '')}/api/leads/stage`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-adara-signature': secrets.CRM_WEBHOOK_SECRET },
      body: JSON.stringify({ ...input, stage: stageMap[input.stage], botpressConversationId: conversation.id }),
    })
    if (!response.ok) throw new Error(`CRM no pudo actualizar el embudo (HTTP ${response.status})`)
    return await response.json()
  },
})
