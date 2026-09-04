import { timingSafeEqual } from "node:crypto";

export function isValidBotpressWebhook(signature: string | null, rawBody: string) {
  const secret = process.env.BOTPRESS_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = Buffer.from(secret);
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

