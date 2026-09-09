import { describe, expect, it } from 'vitest'
import { requestedDeliveryDate } from './delivery-date'

const wednesday = new Date('2026-09-09T15:00:00.000Z')
describe('requestedDeliveryDate', () => {
  it('captures tomorrow in Argentina as a valid ISO date', () => expect(requestedDeliveryDate('para mañana', wednesday)).toBe('2026-09-10T15:00:00.000Z'))
  it('captures an upcoming weekday', () => expect(requestedDeliveryDate('el viernes', wednesday)).toBe('2026-09-11T15:00:00.000Z'))
  it('captures an explicit date', () => expect(requestedDeliveryDate('el 18/09/2026', wednesday)).toBe('2026-09-18T15:00:00.000Z'))
  it('does not invent a date', () => expect(requestedDeliveryDate('por la tarde', wednesday)).toBeUndefined())
})
