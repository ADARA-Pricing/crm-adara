import { StringDecoder } from 'node:string_decoder';

// Deployment failures can echo the entire child command, including its secrets.
// Suppress sensitive lines altogether instead of guessing where a value ends.
export function redactCliLine(line) {
  if (/bp_pat_|--token\b|--secrets?\b|CRM_WEBHOOK_SECRET|BOTPRESS_WEBHOOK_SECRET|BOTPRESS_API_TOKEN|authorization\s*[:=]|bearer\s+/i.test(line)) {
    return '[Salida omitida: contiene credenciales de despliegue]';
  }
  return line;
}

export function createSafeCliOutput(write) {
  const decoder = new StringDecoder('utf8');
  let pending = '';
  function consume(text) {
    pending += text;
    let boundary;
    while ((boundary = pending.indexOf('\n')) !== -1) {
      write(`${redactCliLine(pending.slice(0, boundary))}\n`);
      pending = pending.slice(boundary + 1);
    }
  }
  return {
    push(chunk) { consume(decoder.write(Buffer.from(chunk))); },
    end() {
      consume(decoder.end());
      if (pending) write(`${redactCliLine(pending)}\n`);
      pending = '';
    },
  };
}
