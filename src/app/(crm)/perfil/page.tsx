import { requireCrmUser } from "@/lib/auth";
import { PhotoForm } from "./photo-form";
import { OperatorAvatar } from "@/components/operator-avatar";
import { ProfileForm } from "./profile-form";
import { prisma } from "@/lib/prisma";
export default async function ProfilePage() {
  const user = await requireCrmUser();
  const photo = await prisma.operatorAvatarPhoto.findUnique({ where: { userId: user.id }, select: { userId: true } });
  const role = user.role === "ADMIN" ? "Administrador" : user.role === "LOGISTICS" ? "Logística" : "Ventas";
  return <div className="settings-page"><aside className="settings-nav" aria-label="Secciones de ajustes"><p className="eyebrow">Ajustes</p><strong>Perfil</strong><a href="#perfil" aria-current="page">Configuración del perfil</a><span>Seguridad</span><span className="settings-soon">Sesiones próximamente</span></aside><main className="settings-main"><header className="settings-heading"><div><p className="eyebrow">Configuración personal</p><h1>Configuración de perfil</h1><p>Actualizá cómo te ve el equipo en el CRM.</p></div></header><section id="perfil" className="panel settings-identity"><div className="settings-avatar"><OperatorAvatar userId={user.id} name={user.displayName || user.email} color={user.avatarColor} /><PhotoForm hasPhoto={Boolean(photo)} /></div><div className="settings-account-data"><div><span>ID de usuario</span><code>{user.id}</code></div><div><span>Correo de acceso</span><strong>{user.email}</strong></div><div><span>Rol</span><strong>{role}</strong></div><small>El correo, rol y permisos se administran desde el acceso seguro del CRM.</small></div><ProfileForm name={user.displayName || ""} color={user.avatarColor} /></section><section className="panel settings-security"><h2>Seguridad</h2><p>Tu sesión se gestiona mediante el proveedor de acceso seguro. No guardamos contraseñas dentro del CRM.</p><span className="badge neutral">Sesión protegida</span></section></main></div>;
}
