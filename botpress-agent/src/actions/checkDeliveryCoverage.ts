import { Action, configuration, secrets, z } from '@botpress/runtime'

export const checkDeliveryCoverage = new Action({
  name: 'checkDeliveryCoverage',
  description: 'Verifica contra la cobertura vigente de mensajería de Adara si una localidad puede recibir envío privado. Usala antes de prometer cobertura o entrega el mismo día.',
  input: z.object({
    locality: z.string().min(2).describe('Localidad o barrio informado por el cliente.'),
    postalCode: z.string().optional().describe('Código postal, si el cliente lo conoce.'),
  }),
  output: z.object({
    covered: z.boolean(),
    zoneName: z.string().optional(),
    cutoffHour: z.number().nullable(),
    requiresManualReview: z.boolean(),
  }),
  async handler({ input }) {
    const crmApiBaseUrl = configuration.crmApiBaseUrl || 'https://crm-adara.vercel.app'
    const response = await fetch(`${crmApiBaseUrl.replace(/\/$/, '')}/api/coverage/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-adara-signature': secrets.CRM_WEBHOOK_SECRET },
      body: JSON.stringify(input),
    })
    if (!response.ok) throw new Error(`No se pudo verificar cobertura (HTTP ${response.status})`)
    return await response.json()
  },
})
