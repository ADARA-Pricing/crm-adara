import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const adminEmail = () => process.env.CRM_ADMIN_EMAIL?.trim().toLowerCase();

export async function requireCrmUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  const email = user.email.toLowerCase();
  const primaryAdmin = adminEmail();
  let profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  if (!profile && primaryAdmin === email) {
    profile = await prisma.userProfile.create({ data: { id: user.id, email, displayName: user.user_metadata?.full_name || null, role: "ADMIN" } });
  }
  if (!profile || !profile.isActive) redirect("/login?denied=1");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireCrmUser();
  if (profile.role !== "ADMIN") redirect("/");
  return profile;
}

export async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
