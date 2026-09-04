"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ denied }: { denied: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(denied ? "Tu cuenta no tiene acceso a este CRM." : "");
  const [sending, setSending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setMessage("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setSending(false);
    if (error) { setMessage("Correo o contraseña incorrectos."); return; }
    window.location.assign("/");
  }
  return <form onSubmit={submit} className="login-form"><label>Correo corporativo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@adaragroup.com.ar" autoComplete="email" required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><button className="button" type="submit" disabled={sending}>{sending ? "Ingresando…" : "Ingresar al CRM"}</button>{message ? <p role="status">{message}</p> : null}</form>;
}
