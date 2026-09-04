"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const productSchema = z.object({
  sku: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().max(3000).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  characteristics: z.string().trim().max(3000).optional(),
  includedItems: z.string().trim().max(1000).optional(),
  price: z.coerce.number().int().nonnegative(),
  shipping: z.coerce.number().int().nonnegative(),
  isActive: z.boolean()
});

function readProductForm(formData: FormData) {
  const result = productSchema.safeParse({
    sku: formData.get("sku"), name: formData.get("name"), category: formData.get("category"),
    description: formData.get("description") || undefined, shortDescription: formData.get("shortDescription") || undefined,
    characteristics: formData.get("characteristics") || undefined, includedItems: formData.get("includedItems") || undefined,
    price: formData.get("price"), shipping: formData.get("shipping"), isActive: formData.get("isActive") === "on"
  });
  if (!result.success) throw new Error("Revisá los datos obligatorios del producto.");
  const data = result.data;
  const technicalSpecs = Object.fromEntries((data.characteristics || "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [key, ...values] = line.split(":");
    return [key.trim(), values.join(":").trim() || "Sí"];
  }).filter(([key]) => key));
  return {
    sku: data.sku.toUpperCase(), name: data.name, category: data.category, description: data.description || null,
    shortDescription: data.shortDescription || null, technicalSpecs, includedItems: (data.includedItems || "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean),
    priceCents: data.price * 100, shippingCents: data.shipping * 100, isActive: data.isActive, isAvailableForBot: data.isActive
  };
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const data = readProductForm(formData);
  const product = await prisma.product.create({ data });
  revalidatePath("/productos");
  revalidatePath("/");
  redirect(`/productos/${product.id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const data = readProductForm(formData);
  await prisma.product.update({ where: { id }, data });
  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  revalidatePath("/");
  redirect(`/productos/${id}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!product) redirect("/productos");
  if (product._count.orderItems) {
    await prisma.product.update({ where: { id }, data: { isActive: false, isAvailableForBot: false } });
    revalidatePath("/productos");
    revalidatePath(`/productos/${id}`);
    return;
  }
  await prisma.product.delete({ where: { id } });
  revalidatePath("/productos");
  revalidatePath("/");
  redirect("/productos");
}

export async function toggleProductStatus(id: string, nextActive: boolean) {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { isActive: nextActive, isAvailableForBot: nextActive } });
  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  revalidatePath("/");
}
