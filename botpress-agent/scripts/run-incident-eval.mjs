// Safety wrapper: refuse production, verify dev configuration, then select a fixture.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const cli = fileURLToPath(new URL('../node_modules/@botpress/adk-cli/dist/cli.js', import.meta.url))
const bun = process.env.ADARA_BUN_EXECUTABLE || 'bun'
const scenarios = {
  'incident-greeting': 'available', 'incident-available': 'available',
  'incident-photos': 'available', 'incident-missing': 'missing',
  'incident-handoff-failure': 'handoff_failure', 'incident-disabled': 'disabled',
  'incident-paused': 'paused',
}
const name = process.argv[2]
if (!Object.hasOwn(scenarios, name) || process.argv.length !== 3) throw new Error('Pass exactly one known incident eval name; production is forbidden.')
const prod = JSON.parse(readFileSync(new URL('../agent.json', import.meta.url), 'utf8'))
const dev = JSON.parse(readFileSync(new URL('../agent.local.json', import.meta.url), 'utf8'))
if (!dev.devId || dev.devId === prod.botId) throw new Error('A distinct development bot is required.')
const config = spawnSync(bun, [cli, 'config:get', 'crmApiBaseUrl', '--format', 'json'], { cwd: root, encoding: 'utf8' })
if (config.status !== 0 || JSON.parse(config.stdout).value !== 'http://127.0.0.1:3102') throw new Error('Dev bot must point to the local fixture CRM.')
const selected = await fetch('http://127.0.0.1:3102/__scenario', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: scenarios[name] }),
})
if (!selected.ok || (await selected.json()).scenario !== scenarios[name]) throw new Error('Fixture scenario could not be verified.')
const result = spawnSync(bun, [cli, 'evals', name, '--server', 'http://localhost:3104', '--format', 'json'], { cwd: root, encoding: 'utf8', timeout: 180000 })
if (result.error) throw result.error
const report = JSON.parse(result.stdout)
console.log(JSON.stringify({
  passed: report.passed, failed: report.failed, error: report.error,
  turns: report.evals?.flatMap(e => e.turns.map(t => ({ user: t.userMessage, response: t.botResponse, pass: t.pass }))),
}, null, 2))
process.exit(result.status === 0 && report.failed === 0 && report.passed === 1 ? 0 : 1)
