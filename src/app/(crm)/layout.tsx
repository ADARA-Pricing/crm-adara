import type { ReactNode } from "react";
import { requireCrmUser, signOut } from "@/lib/auth";
import { CrmFrame } from "@/components/crm-frame";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const user = await requireCrmUser();
  return <CrmFrame name={user.displayName || user.email} role={user.role} signOut={signOut}>{children}</CrmFrame>;
}
