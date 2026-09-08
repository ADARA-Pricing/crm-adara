// Test-only CRM. Bound to loopback, entirely in memory, with no upstream/database access.
import { createServer } from 'node:http'

let scenario = 'available'
const calls = {}
const product = {
  id: 'infinix-smart-10-negro',
  name: 'Celular Infinix Smart 10 negro', category: 'Celulares',
  description: 'Celular negro', shortDescription: null, botDescription: null,
  technicalSpecs: { almacenamiento: '128 GB', ram: '4 GB física + 4 GB extendida' },
  priceCents: 19999900, shippingCents: 700000, warrantyMonths: 12,
  priceFormatted: '$199.999', shippingFormatted: '$7.000',
  includedItems: ['Cargador', 'Film', 'Funda'], imageUrls: [],
  productUrl: 'https://example.test/producto-smart-10',
}
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://127.0.0.1').pathname
  const reply = (data, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)) }
  if (path === '/__status') return reply({ scenario, calls })
  let body = ''
  for await (const chunk of req) { body += chunk; if (body.length > 20000) return reply({ error: 'too_large' }, 413) }
  let input
  try { input = body ? JSON.parse(body) : {} } catch { return reply({ error: 'invalid_json' }, 400) }
  if (path === '/__scenario' && req.method === 'POST') {
    if (!['available', 'missing', 'disabled', 'handoff_failure', 'paused'].includes(input.scenario)) return reply({ error: 'invalid_scenario' }, 400)
    scenario = input.scenario
    for (const key of Object.keys(calls)) delete calls[key]
    return reply({ scenario })
  }
  calls[path] = (calls[path] || 0) + 1
  if (path === '/api/leads/stage') return reply({ customerId: 'fixture-customer', stage: input.stage || 'FIRST_CONTACT', botPaused: scenario === 'paused' })
  if (path === '/api/conversations/control') return reply({ botPaused: scenario === 'paused' })
  if (path === '/api/catalog/product') {
    if (scenario === 'missing') return reply({ available: false, reason: 'catalog_missing', catalogCategories: ['Celulares'] })
    if (scenario === 'disabled') return reply({ available: false, reason: 'not_offered', catalogCategories: ['Celulares'] })
    return reply({ available: true, product, catalogCategories: ['Celulares'] })
  }
  if (path === '/api/handoffs') return scenario === 'handoff_failure'
    ? reply({ error: 'simulated_failure' }, 503) : reply({ queued: true, taskId: 'fixture-task' })
  if (path === '/api/coverage/check') return reply({ covered: false, cutoffHour: 12, requiresManualReview: true })
  // Orders/quotes are intentionally unavailable: tests must never create a real sale.
  return reply({ error: 'fixture_endpoint_not_allowed' }, 409)
}).listen(3102, '127.0.0.1', () => console.log('Fixture CRM: http://127.0.0.1:3102 (no external writes)'))
