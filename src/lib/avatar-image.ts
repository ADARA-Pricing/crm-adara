import sharp from "sharp";
export async function normalizeAvatar(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > 750_000) throw new Error("Imagen demasiado grande");
  const decoder = sharp(bytes, { limitInputPixels: 16_000_000, animated: false });
  const metadata = await decoder.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) throw new Error("Formato no permitido");
  // Re-encoding strips metadata and never stores client-provided SVG or executable content.
  return decoder.rotate().resize(128, 128, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
}
