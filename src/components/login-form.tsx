"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ denied }: { denied: boolean }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(denied ? "Tu cuenta no tiene acceso a este CRM." : "");
  const [sending, setSending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setMessage("");
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setSending(false); setMessage(error ? "No pudimos enviar el enlace. Revisá el correo e intentá nuevamente." : "Te enviamos un enlace seguro a tu correo.");
  }
  return <form onSubmit={submit} className="login-form"><label>Correo corporativo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@adaragroup.com.ar" required /></label><button className="button" type="submit" disabled={sending}>{sending ? "Enviando…" : "Enviar enlace de acceso"}</button>{message ? <p role="status">{message}</p> : null}</form>;
}
