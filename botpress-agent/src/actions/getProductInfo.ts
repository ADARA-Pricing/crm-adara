import { Action, configuration, secrets, z } from '@botpress/runtime'

export const getProductInfo = new Action({
  name: 'getProductInfo',
  description: 'Consulta la ficha vigente del Infinix del anuncio en CRM: precio, características aprobadas, accesorios y URLs reales de fotos. Consultar al hablar del producto; nunca inventar datos ausentes.',
  input: z.object({}),
  output: z.object({
    available: z.boolean(),
    catalogCategories: z.array(z.string()),
    product: z.object({
      category: z.string().nullable(), name: z.string(), description: z.string().nullable(), shortDescription: z.string().nullable(), botDescription: z.string().nullable(),
      technicalSpecs: z.unknown(), priceCents: z.number(), shippingCents: z.number(), warrantyMonths: z.number(),
      priceFormatted: z.string(), shippingFormatted: z.string(), includedItems: z.array(z.string()), imageUrls: z.array(z.string()), productUrl: z.string(),
    }).optional(),
  }),
  async handler() {
    const base = configuration.crmApiBaseUrl || 'https://crm-adara.vercel.app'
    const response = await fetch(`${base.replace(/\/$/, '')}/api/catalog/product`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-adara-signature': secrets.CRM_WEBHOOK_SECRET }, body: '{}',
    })
    if (!response.ok) throw new Error('No se pudo consultar la ficha del producto. No confirmar datos de memoria.')
    return await response.json()
  },
})
