import { Action, configuration, context, secrets, z } from '@botpress/runtime'

export const recordConfirmedOrder = new Action({
  name: 'recordConfirmedOrder',
  description: 'Registra en CRM un pedido que el cliente ya revisó y confirmó explícitamente. El resultado siempre queda pendiente de revisión comercial.',
  input: z.object({
    deliveryMethod: z.enum(['courier', 'pickup']).describe('Modalidad confirmada por el cliente.'),
    paymentMethod: z.enum(['cash_or_transfer', 'card_one_payment']).describe('Medio de pago confirmado.'),
    recipientName: z.string().min(2).describe('Nombre completo de quien recibe o retira.'),
    phone: z.string().min(6).optional().describe('Teléfono de contacto; puede ser el mismo de WhatsApp.'),
    deliveryAddress: z.string().min(5).describe('Dirección completa para envío, o Av. Cramer 2548 para retiro.'),
    postalCode: z.string().min(3).optional().describe('Código postal si el cliente lo conoce.'),
    locality: z.string().min(2).describe('Localidad o barrio informado por el cliente.'),
    requestedDate: z.string().datetime().optional().describe('Fecha solicitada en ISO 8601 si fue acordada.'),
  }),
  output: z.object({
    orderId: z.string(),
    status: z.string(),
    totalCents: z.number(),
    requiresManualReview: z.boolean(),
  }),
  async handler({ input }) {
    const conversation = context.get('conversation', { optional: true })
    const crmApiBaseUrl = configuration.crmApiBaseUrl || 'https://crm-adara.vercel.app'
    const response = await fetch(`${crmApiBaseUrl.replace(/\/$/, '')}/api/orders/confirm`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-adara-signature': secrets.CRM_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        ...input,
        deliveryMethod: input.deliveryMethod === 'courier' ? 'COURIER' : 'PICKUP',
        paymentMethod: input.paymentMethod === 'cash_or_transfer' ? 'CASH_OR_TRANSFER' : 'CARD_ONE_PAYMENT',
        botpressConversationId: conversation?.id,
      }),
    })

    if (!response.ok) {
      throw new Error(`CRM rechazó el pedido (HTTP ${response.status})`)
    }

    return await response.json()
  },
})
