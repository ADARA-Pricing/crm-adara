import { Action, configuration, secrets, z } from '@botpress/runtime'

export const resolveAddress = new Action({
  name: 'resolveAddress',
  description: 'Normaliza una dirección argentina con la fuente geográfica oficial. Puede devolver localidad/provincia; nunca inventa código postal ni confirma cobertura.',
  input: z.object({
    address: z.string().min(5).describe('Calle y altura informadas por el cliente.'),
    locality: z.string().min(2).optional().describe('Localidad si ya fue informada.'),
  }),
  output: z.object({
    resolved: z.boolean(),
    normalizedAddress: z.string().optional(),
    locality: z.string().optional(),
    province: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    source: z.enum(['georef-ar', 'unresolved']),
    postalCode: z.null(),
  }),
  async handler({ input }) {
    const crmApiBaseUrl = configuration.crmApiBaseUrl || 'https://crm-adara.vercel.app'
    try {
      const response = await fetch(`${crmApiBaseUrl.replace(/\/$/, '')}/api/address/resolve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-adara-signature': secrets.CRM_WEBHOOK_SECRET },
        body: JSON.stringify(input),
      })
      if (!response.ok) return { resolved: false, source: 'unresolved' as const, postalCode: null }
      return await response.json()
    } catch {
      return { resolved: false, source: 'unresolved' as const, postalCode: null }
    }
  },
})
