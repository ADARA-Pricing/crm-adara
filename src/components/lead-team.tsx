"use client";
import { useState } from "react";
import { assignLead, updateLeadTask } from "@/app/clientes/team-actions";
type Member = { id: string; displayName: string | null; email: string };
export function LeadOwner({ id, assigneeId, members, onSaved }: { id: string; assigneeId: string | null; members: Member[]; onSaved: () => void }) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  return <form className="lead-task-form" onSubmit={async e=>{e.preventDefault();if(busy)return;const data=new FormData(e.currentTarget);setBusy(true);try{const r=await assignLead({id,assigneeId:String(data.get("assigneeId")||""),expected:assigneeId});setMessage(r.message);onSaved();}catch{setMessage("Revisá tu sesión.");}finally{setBusy(false);}}}>
    <label>Responsable del lead<select key={assigneeId} name="assigneeId" defaultValue={assigneeId || ""}><option value="">Sin asignar</option>{members.map(m=><option key={m.id} value={m.id}>{m.displayName||m.email}</option>)}{assigneeId&&!members.some(m=>m.id===assigneeId)&&<option value={assigneeId}>Miembro inactivo</option>}</select></label><button className="button secondary" disabled={busy}>Guardar responsable</button><p role="status">{message}</p>
  </form>;
}
export function LeadTaskEditor({ task, members, onSaved }: { task: { id: string; customerId: string | null; assigneeId: string | null; status: string; dueAt: string | null; updatedAt: string }; members: Member[]; onSaved: () => void }) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const due = task.dueAt ? new Date(Date.parse(task.dueAt)-10800000).toISOString().slice(0,16) : "";
  return <form className="lead-task-form" key={task.updatedAt} onSubmit={async e=>{e.preventDefault();if(busy)return;const data=new FormData(e.currentTarget);setBusy(true);try{const date=String(data.get("dueAt")||"");const r=await updateLeadTask({id:task.id,customerId:task.customerId!,assigneeId:String(data.get("assigneeId")||""),status:String(data.get("status")),dueAt:date?new Date(`${date}:00-03:00`).toISOString():"",expected:task.updatedAt});setMessage(r.message);onSaved();}catch{setMessage("No se pudo guardar la tarea.");}finally{setBusy(false);}}}>
    <label>Estado<select name="status" defaultValue={task.status}>{Object.entries({OPEN:"Pendiente",IN_PROGRESS:"En curso",DONE:"Completada",CANCELLED:"Cancelada"}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label>Responsable<select name="assigneeId" defaultValue={task.assigneeId||""}><option value="">Sin asignar</option>{members.map(m=><option key={m.id} value={m.id}>{m.displayName||m.email}</option>)}{task.assigneeId&&!members.some(m=>m.id===task.assigneeId)&&<option value={task.assigneeId}>Miembro inactivo</option>}</select></label>
    <label>Vencimiento (Argentina)<input name="dueAt" type="datetime-local" defaultValue={due}/></label><button className="button secondary" disabled={busy}>Guardar tarea</button><p role="status">{message}</p>
  </form>;
}
