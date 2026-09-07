import type { ReactNode } from "react";

/** The authenticated route layout now owns the persistent frame. */
export function CrmShell({ children }: { active: string; children: ReactNode }) {
  return <>{children}</>;
}
