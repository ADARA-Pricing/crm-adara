import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSafeCliOutput, redactCliLine } from './safe-cli-output.mjs';

test('suppresses credentials including escaped command arguments', () => {
  for (const line of [
    'failed --token "sample-private-value"',
    'failed --secrets \\"CRM_WEBHOOK_SECRET=sample-private-value\\"',
    '{"BOTPRESS_API_TOKEN":"sample-private-value"}',
    'Bearer sample-private-value',
    'bp_pat_sample-private-value',
  ]) assert.ok(!redactCliLine(line).includes('sample-private-value'));
});

test('buffers partial lines and flushes final unterminated output', () => {
  let output = '';
  const stream = createSafeCliOutput((line) => { output += line; });
  stream.push(Buffer.from('failed --to'));
  assert.equal(output, '');
  stream.push(Buffer.from('ken sample-private-value\nCRM_WEB'));
  stream.push(Buffer.from('HOOK_SECRET=another-private-value'));
  stream.end();
  assert.ok(!output.includes('private-value'));
  assert.equal(output.trim().split('\n').length, 2);
});

test('preserves ordinary diagnostic output and split UTF-8', () => {
  let output = '';
  const stream = createSafeCliOutput((line) => { output += line; });
  const input = Buffer.from('Publicación lista: https://crm-adara.vercel.app\n');
  for (const byte of input) stream.push(Buffer.from([byte]));
  stream.end();
  assert.equal(output, input.toString());
});
