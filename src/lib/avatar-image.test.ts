import { expect, it } from "vitest";
import sharp from "sharp";
import { normalizeAvatar } from "./avatar-image";
it("resizes and reencodes a photo without metadata", async () => {
  const source = await sharp({ create: { width: 220, height: 180, channels: 3, background: "red" } }).png().toBuffer();
  const metadata = await sharp(await normalizeAvatar(source)).metadata();
  expect(metadata.format).toBe("webp"); expect(metadata.width).toBe(128); expect(metadata.height).toBe(128); expect(metadata.exif).toBeUndefined();
});
it("rejects empty, oversized, malformed and SVG images", async () => {
  for (const bytes of [Buffer.alloc(0), Buffer.alloc(750001), Buffer.from("not an image"), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>')]) await expect(normalizeAvatar(bytes)).rejects.toThrow();
});
