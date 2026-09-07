"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {saveRule,toggleRule} from "@/app/automatizaciones/actions";
import {funnelStages} from "@/lib/funnel-stages";
type Rule={id:string;name:string;stage:string;category:string|null;action:string;content:string;dueHours:number;enabled:boolean};
export function AutomationEditor({rule,categories}:{rule?:Rule;categories:string[]}){
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");const router=useRouter();
  return <section className="panel"><h2>{rule?rule.name:"Nueva regla"}</h2>{rule&&<p>{rule.enabled?"Activa":"Desactivada"}</p>}<form className="task-form" onSubmit={async e=>{e.preventDefault();if(busy)return;const data=new FormData(e.currentTarget);setBusy(true);try{const result=await saveRule({...Object.fromEntries(data),id:rule?.id});setMessage(result.message);if(result.ok)router.refresh();}catch{setMessage("No se pudo guardar. Revisá tu sesión.");}finally{setBusy(false);}}}>
  <label>Nombre<input name="name" required minLength={3} maxLength={120} defaultValue={rule?.name}/></label><label>Al entrar a etapa<select name="stage" defaultValue={rule?.stage||"VERY_INTERESTED"}>{funnelStages.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>Categoría de interés<select name="category" defaultValue={rule?.category||""}><option value="">Todas</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
  <label>Acción<select name="action" defaultValue={rule?.action||"TASK"}><option value="TASK">Crear tarea para el responsable</option><option value="MESSAGE_DRAFT">Preparar mensaje para revisión</option></select></label><label>Vencimiento de tarea (horas)<input type="number" name="dueHours" min={0} max={720} defaultValue={rule?.dueHours??24}/></label><label>Texto de tarea o mensaje<textarea name="content" required minLength={3} maxLength={1000} defaultValue={rule?.content}/></label><button className="button" disabled={busy}>Guardar desactivada</button></form>
  {rule&&<button className="button secondary" disabled={busy} onClick={async()=>{if(busy)return;setBusy(true);try{const r=await toggleRule(rule.id,!rule.enabled);setMessage(r.message);router.refresh();}catch{setMessage("No se pudo actualizar la regla.");}finally{setBusy(false);}}}>{rule.enabled?"Desactivar regla":"Activar regla guardada"}</button>}<p role="status">{message}</p></section>;
}
