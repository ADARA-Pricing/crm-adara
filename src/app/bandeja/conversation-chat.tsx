"use client";
/* eslint-disable @next/next/no-img-element -- WhatsApp media hosts are dynamic and cannot be allow-listed safely. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BotpressMessage } from "@/lib/botpress";
import { sendConversationMessage, setConversationBotPaused } from "./chat-actions";
import type { readConversation } from "./chat-actions";
import { useInboxCache, useStoreInboxSnapshot } from "./inbox-preloader";
import { mergeInboxMessages } from "@/lib/inbox-cache";
import { messageActivity } from "@/lib/conversation-activity";
import { ReplyWindow } from "@/components/reply-window";
import { SafeMessage } from "@/components/safe-message";
import { crmDate } from "@/lib/crm-display";
import { shouldSubmitChat } from "@/lib/chat-keyboard";

type Message = BotpressMessage & { author: string | null };
function safeUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : undefined; } catch { return undefined; }
}
function MessageContent({ message }: { message: Message }) {
  const p = message.payload;
  const text = typeof p.text === "string" ? p.text : typeof p.title === "string" ? p.title : "";
  const url = safeUrl(p.imageUrl || p.audioUrl || p.videoUrl || p.fileUrl);
  const mediaLabel = message.type === "image" ? "imagen" : message.type === "audio" ? "audio" : message.type === "video" ? "video" : "archivo";
  return <>
    {text ? <SafeMessage text={text} /> : null}
    {url && message.type === "image" ? <a className="chat-media chat-media-image" href={url} target="_blank" rel="noopener noreferrer" aria-label="Abrir imagen en tamaño completo"><img src={url} alt={text || "Imagen compartida"} loading="lazy" /></a> : null}
    {url && message.type === "audio" ? <audio className="chat-media chat-media-audio" controls preload="metadata" src={url}>Tu navegador no permite reproducir este audio.</audio> : null}
    {url && message.type === "video" ? <video className="chat-media chat-media-video" controls preload="metadata" src={url}>Tu navegador no permite reproducir este video.</video> : null}
    {url && !["image", "audio", "video"].includes(message.type) ? <a className="chat-file" href={url} target="_blank" rel="noopener noreferrer">Abrir {mediaLabel}</a> : null}
    {!text && !url ? <p className="muted">Mensaje de tipo {message.type} (contenido no disponible en esta vista)</p> : null}
    {Array.isArray(p.options) ? <p>{p.options.map(o => typeof o === "object" && o && "label" in o ? String(o.label) : "").filter(Boolean).join(" · ")}</p> : null}
  </>;
}

export function ConversationChat({ id, initialPaused, refreshPage = true, channel = "whatsapp", suggestedDraft, stageControl, compactLead = false }: { id: string; initialPaused: boolean; refreshPage?: boolean; channel?: string; suggestedDraft?: { id: string; content: string }; stageControl?: React.ReactNode; compactLead?: boolean }) {
  const router = useRouter();
  const cached = useInboxCache()[id];
  const storeSnapshot = useStoreInboxSnapshot();
  const [messages, setMessages] = useState<Message[]>(() => mergeInboxMessages([], cached?.messages ?? []));
  const [paused, setPaused] = useState(initialPaused);
  const [cursor, setCursor] = useState<string | undefined>(cached?.nextToken);
  const [loading, setLoading] = useState(!cached);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingSend, setPendingSend] = useState<{ text: string; status: string } | null>(null);
  const [text, setText] = useState("");
  const [draftId, setDraftId] = useState<string | undefined>();
  const [usedDraft, setUsedDraft] = useState<string | undefined>();
  const alive = useRef(true);
  const busyRef = useRef(false);
  const refreshing = useRef(false);
  const version = useRef(0);
  const loaded = useRef(false);
  const request = useRef<{ text: string; id: string } | undefined>(undefined);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cached) return;
    setMessages(previous => mergeInboxMessages(previous, cached.messages));
    setLoading(false);
    if (!loaded.current) setCursor(cached.nextToken);
  }, [cached]);

  async function refresh(older = false) {
    if (refreshing.current) return;
    refreshing.current = true;
    const expectedVersion = version.current;
    const query = new URLSearchParams({ id });
    if (older && cursor) query.set("cursor", cursor);
    const result: Awaited<ReturnType<typeof readConversation>> = await fetch(`/api/inbox/messages?${query}`, { cache: "no-store", signal: AbortSignal.timeout(25000) })
      .then(async response => { if (!response.ok) throw new Error("History unavailable"); return response.json(); })
      .catch(() => ({ ok: false as const, error: "No se pudo actualizar el historial. Revisá tu conexión y tu sesión." }));
    refreshing.current = false;
    if (!alive.current || expectedVersion !== version.current) return;
    setLoading(false);
    if (!result.ok) { setHistoryError(result.error); return; }
    setHistoryError("");
    setPaused(result.botPaused);
    setMessages(previous => mergeInboxMessages(previous, result.messages));
    if (!older) storeSnapshot(id, { messages: result.messages, nextToken: result.nextToken });
    if (older || !loaded.current) setCursor(result.nextToken);
    if (!loaded.current) {
      loaded.current = true;
      if (result.profileName && refreshPage) router.refresh();
      setTimeout(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight; }, 50);
    }
  }
  useEffect(() => {
    alive.current = true;
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
    void refresh();
    const timer = setInterval(() => { if (!busyRef.current && document.visibilityState === "visible") void refresh(); }, 10000);
    return () => { alive.current = false; clearInterval(timer); };
    // Each conversation gets its own component instance (key=id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function changeControl() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); version.current++; setError(""); setNotice("");
    try {
      const result = await setConversationBotPaused(id, !paused);
      if (!result.ok) setError(result.error);
      else { setPaused(!paused); setNotice(paused ? "El bot responderá al próximo mensaje; no contesta los pendientes automáticamente." : "Bot pausado. Podés atender esta conversación."); if (refreshPage) router.refresh(); }
    } catch { setError("No se pudo confirmar el cambio. Actualizá el estado antes de responder."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current || !text.trim() || !paused) return;
    busyRef.current = true; setBusy(true); version.current++; setError(""); setNotice("");
    const content = text.trim();
    const sentAt = new Date().toISOString();
    setPendingSend({ text: content, status: "Enviando…" });
    setText("");
    setTimeout(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight; }, 0);
    if (request.current?.text !== content) request.current = { text: content, id: crypto.randomUUID() };
    try {
      const result = await sendConversationMessage({ conversationId: id, text: content, requestId: request.current.id, draftId });
      if (!result.ok) {
        setError(result.error);
        setPendingSend({ text: content, status: "uncertain" in result && result.uncertain ? "Envío sin confirmar: revisá el historial antes de repetirlo" : "No enviado" });
        setText(current => current || content);
      } else {
        if (result.messageId) {
          const accepted: Message = { id: result.messageId, conversationId: id, userId: "", createdAt: sentAt, direction: "outgoing", type: "text", payload: { text: content }, author: "Vos" };
          setMessages(current => mergeInboxMessages(current, [accepted]));
          storeSnapshot(id, { messages: mergeInboxMessages(messages, [accepted]), nextToken: cursor });
        }
        setPendingSend(null); setUsedDraft(draftId); setDraftId(undefined); request.current = undefined;
        setNotice("Mensaje aceptado para envío; entrega y lectura sin confirmar.");
      }
      setTimeout(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight; }, 50);
    } catch { setPendingSend({text:content,status:"Envío sin confirmar"}); setText(current => current || content); setError("No pudimos confirmar el envío. Revisá el historial antes de repetirlo."); }
    finally { busyRef.current = false; setBusy(false); void refresh(); }
  }
  return <section className="conversation-chat" aria-label="Chat de la conversación">
    {!compactLead && <ReplyWindow activity={{ ...messageActivity(messages), channel }} />}
    {suggestedDraft && usedDraft !== suggestedDraft.id && <section className="context-note"><p>Borrador de regla: {suggestedDraft.content}</p><button className="button secondary" disabled={busy || !paused || !!text} onClick={() => { setText(suggestedDraft.content); setDraftId(suggestedDraft.id); }}>Usar borrador (no envía)</button></section>}
    <div className="chat-controls"><span className={`badge ${paused ? "warning" : "success"}`}>{paused ? "Bot pausado · Atención manual" : "Bot activo"}</span><button className="button secondary" disabled={busy} onClick={changeControl}>{paused ? "Reactivar bot" : "Pausar bot y atender"}</button><button className="button secondary" disabled={busy} onClick={() => void refresh()}>Actualizar</button>{stageControl}</div>
    <div className="chat-messages" ref={body} aria-label="Historial de mensajes" aria-busy={loading}>
      {compactLead && <ReplyWindow className="lead-chat-window" activity={{ ...messageActivity(messages), channel }} />}
      {cursor ? <button className="button secondary" disabled={busy} onClick={async () => { setBusy(true); busyRef.current = true; try { await refresh(true); } finally { setBusy(false); busyRef.current = false; } }}>Cargar anteriores</button> : null}
      {loading ? <p className="muted">Cargando conversación…</p> : !messages.length && !historyError ? <p className="muted">No hay mensajes disponibles en Botpress.</p> : null}
      {historyError ? <p role="alert">{historyError}</p> : null}
      {messages.map(m => <div key={m.id} data-incoming-id={m.direction === "incoming" ? m.id : undefined} className={`chat-bubble ${m.direction === "incoming" ? "incoming" : "outgoing"}`}><small>{m.direction === "incoming" ? "Cliente" : m.author ? `Equipo · ${m.author}` : "Adara / Bot"}</small><MessageContent message={m} /><time dateTime={m.createdAt}>{crmDate(m.createdAt, true)}</time></div>)}
      {pendingSend && <div className="chat-bubble outgoing" role="status"><small>{pendingSend.status}</small><SafeMessage text={pendingSend.text} /></div>}
    </div>
    <form className="chat-composer" onSubmit={send}>
      <label htmlFor="reply">Respuesta al cliente</label>
      <textarea id="reply" rows={2} maxLength={4000} value={text} onChange={e => setText(e.target.value)} onKeyDown={event => { if (shouldSubmitChat({ ...event, isComposing: event.nativeEvent.isComposing, keyCode: event.nativeEvent.keyCode })) { event.preventDefault(); if (!busyRef.current && paused && text.trim()) event.currentTarget.form?.requestSubmit(); } }} disabled={!paused} placeholder={paused ? "Escribí tu respuesta…" : "Pausá el bot para responder desde acá."} />
      <button className="button" disabled={busy || !paused || !text.trim()}>Enviar mensaje</button>
      <small>Enter para enviar · Shift+Enter para salto de línea. El envío manual requiere un mensaje del cliente en las últimas 24 h. No reactiva el bot.</small>
      {error ? <p role="alert">{error}</p> : null}{notice ? <p role="status">{notice}</p> : null}
    </form>
  </section>;
}
