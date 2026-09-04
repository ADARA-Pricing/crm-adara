import { Action, configuration, z } from '@botpress/runtime'

export const quoteOrder = new Action({
  name: 'quoteOrder',
  description: 'Calcula el total de un Infinix Smart 10 negro para envío por mensajería privada o retiro en el local.',
  input: z.object({
    deliveryMethod: z.enum(['courier', 'pickup']).describe('courier para envío por mensajería privada; pickup para retirar en Av. Cramer 2548.'),
    paymentMethod: z.enum(['cash_or_transfer', 'card_one_payment']).describe('Medio de pago elegido.'),
  }),
  output: z.object({
    productPrice: z.number(),
    shippingPrice: z.number(),
    total: z.number(),
    terms: z.string(),
  }),
  async handler({ input }) {
    const crmApiBaseUrl = configuration.crmApiBaseUrl || 'https://crm-adara.vercel.app'
    const response = await fetch(`${crmApiBaseUrl.replace(/\/$/, '')}/api/quotes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deliveryMethod: input.deliveryMethod === 'courier' ? 'COURIER' : 'PICKUP',
        paymentMethod: input.paymentMethod === 'cash_or_transfer' ? 'CASH_OR_TRANSFER' : 'CARD_ONE_PAYMENT',
      }),
    })
    if (!response.ok) throw new Error(`CRM no pudo cotizar el pedido (HTTP ${response.status})`)
    const quote = await response.json() as { productCents: number; shippingCents: number; totalCents: number }

    if (input.deliveryMethod === 'courier') {
      return {
        productPrice: quote.productCents / 100,
        shippingPrice: quote.shippingCents / 100,
        total: quote.totalCents / 100,
        terms: 'Entrega habitualmente de 18 a 21 h. Se paga al cadete en efectivo o transferencia; no se acepta tarjeta ni pago anticipado.'
      }
    }

    return {
      productPrice: quote.productCents / 100,
      shippingPrice: 0,
      total: quote.totalCents / 100,
      terms: input.paymentMethod === 'card_one_payment'
        ? 'Retiro en Av. Cramer 2548, CABA. Tarjeta en un pago con 7% de recargo.'
        : 'Retiro en Av. Cramer 2548, CABA. Efectivo o transferencia al precio publicado.'
    }
  },
})
