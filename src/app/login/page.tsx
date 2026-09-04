import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  return <main className="login-page"><section className="login-card"><p className="eyebrow">Adara group</p><h1>CRM interno</h1><p>Ingresá con tu correo corporativo. Te enviaremos un enlace seguro de acceso.</p><LoginForm denied={denied === "1"} /></section></main>;
}
