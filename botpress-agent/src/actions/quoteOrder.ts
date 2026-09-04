import { Action, z } from '@botpress/runtime'

const productPrice = 199_999
const shippingPrice = 7_000

export const quoteOrder = new Action({
  name: 'quoteOrder',
  description: 'Calcula el total de un Infinix Smart 10 negro para entrega Flex o retiro en el local.',
  input: z.object({
    deliveryMethod: z.enum(['flex', 'pickup']).describe('flex para envío; pickup para retirar en Av. Cramer 2548.'),
    paymentMethod: z.enum(['cash_or_transfer', 'card_one_payment']).describe('Medio de pago elegido.'),
  }),
  output: z.object({
    productPrice: z.number(),
    shippingPrice: z.number(),
    total: z.number(),
    terms: z.string(),
  }),
  async handler({ input }) {
    if (input.deliveryMethod === 'flex') {
      return {
        productPrice,
        shippingPrice,
        total: productPrice + shippingPrice,
        terms: 'Entrega habitualmente de 18 a 21 h. Se paga al cadete en efectivo o transferencia; no se acepta tarjeta ni pago anticipado.'
      }
    }

    const total = input.paymentMethod === 'card_one_payment' ? Math.round(productPrice * 1.07) : productPrice
    return {
      productPrice,
      shippingPrice: 0,
      total,
      terms: input.paymentMethod === 'card_one_payment'
        ? 'Retiro en Av. Cramer 2548, CABA. Tarjeta en un pago con 7% de recargo.'
        : 'Retiro en Av. Cramer 2548, CABA. Efectivo o transferencia al precio publicado.'
    }
  },
})
