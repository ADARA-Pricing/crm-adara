import type { ReactNode } from "react";
import { requireCrmUser, signOut } from "@/lib/auth";
import { CrmFrame } from "@/components/crm-frame";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const user = await requireCrmUser();
  return <CrmFrame userId={user.id} name={user.displayName || user.email} avatarColor={user.avatarColor} role={user.role} signOut={signOut}>{children}</CrmFrame>;
}
