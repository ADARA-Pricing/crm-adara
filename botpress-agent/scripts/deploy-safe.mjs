import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createSafeCliOutput } from './safe-cli-output.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/@botpress/adk-cli/dist/cli.js', import.meta.url));
const child = spawn(process.env.ADARA_BUN_EXECUTABLE || 'bun', [cli, 'deploy', ...process.argv.slice(2)], {
  cwd: project,
  shell: false,
  stdio: ['inherit', 'pipe', 'pipe'],
});
const stdout = createSafeCliOutput((line) => process.stdout.write(line));
const stderr = createSafeCliOutput((line) => process.stderr.write(line));
child.stdout.on('data', (chunk) => stdout.push(chunk));
child.stderr.on('data', (chunk) => stderr.push(chunk));
child.on('error', () => {
  // Do not print the original exception: it may include command arguments.
  console.error('No se pudo iniciar el despliegue. Revisá Bun o ADARA_BUN_EXECUTABLE.');
  process.exitCode = 1;
});
child.on('close', (code) => {
  stdout.end();
  stderr.end();
  process.exitCode = code ?? 1;
});
