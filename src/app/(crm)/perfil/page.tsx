import { requireCrmUser } from "@/lib/auth";
import { PhotoForm } from "./photo-form";
import { OperatorAvatar } from "@/components/operator-avatar";
import { ProfileForm } from "./profile-form";
import { prisma } from "@/lib/prisma";
export default async function ProfilePage() {
  const user = await requireCrmUser();
  const photo = await prisma.operatorAvatarPhoto.findUnique({ where: { userId: user.id }, select: { userId: true } });
  return <><header className="topbar"><div><p className="eyebrow">Configuración personal</p><h1>Mi perfil</h1><p className="topbar-copy">Elegí cómo te ve el equipo en el CRM.</p></div></header><section className="panel profile-preview"><OperatorAvatar userId={user.id} name={user.displayName || user.email} color={user.avatarColor} /><div><strong>{user.displayName || user.email}</strong><small>Vista previa en responsables, tareas y atención.</small></div></section><div className="profile-layout"><PhotoForm hasPhoto={Boolean(photo)} /><ProfileForm name={user.displayName || ""} color={user.avatarColor} /></div></>;
}
