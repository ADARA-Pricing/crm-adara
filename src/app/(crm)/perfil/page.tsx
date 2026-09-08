import { requireCrmUser } from "@/lib/auth";
import { PhotoForm } from "./photo-form";
import { OperatorAvatar } from "@/components/operator-avatar";
import { ProfileForm } from "./profile-form";
export default async function ProfilePage() {
  const user = await requireCrmUser();
  return <><header className="topbar"><div><h1>Mi perfil</h1><p>Elegí cómo te ve el equipo en el CRM.</p></div></header><OperatorAvatar userId={user.id} name={user.displayName || user.email} color={user.avatarColor} /><PhotoForm /><ProfileForm name={user.displayName || ""} color={user.avatarColor} /></>;
}
