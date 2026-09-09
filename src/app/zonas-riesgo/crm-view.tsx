import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DangerZonesPage() {
  redirect("/cobertura?tab=riesgo");
}
