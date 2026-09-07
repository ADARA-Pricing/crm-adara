"use server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
const ruleSchema=z.object({id:z.string().max(160).optional(),name:z.string().trim().min(3).max(120),stage:z.enum(["FIRST_CONTACT","INTERESTED","VERY_INTERESTED","COORDINATE_DELIVERY","LOCAL_PICKUP","COMPLETED","ABANDONED"]),category:z.string().trim().max(80),action:z.enum(["TASK","MESSAGE_DRAFT"]),content:z.string().trim().min(3).max(1000),dueHours:z.coerce.number().int().min(0).max(720)});
export async function saveRule(input:unknown) {
  await requireAdmin();const parsed=ruleSchema.safeParse(input);
  if(!parsed.success)return {ok:false,message:"Revisá nombre, acción, contenido y vencimiento (0 a 720 horas)."};
  const {id,...data}=parsed.data;
  try { if(data.category&&!await prisma.product.findFirst({where:{category:data.category}}))return {ok:false,message:"Elegí una categoría del catálogo."};
    // Editing always pauses the rule. Enabling is a separate explicit action.
    if(id) await prisma.automationRule.update({where:{id},data:{...data,category:data.category||null,enabled:false}});
    else await prisma.automationRule.create({data:{...data,category:data.category||null,enabled:false}});
  } catch{return {ok:false,message:"No se pudo guardar la regla."};}
  revalidatePath("/automatizaciones");return {ok:true,message:"Regla guardada y desactivada. Activala cuando hayas revisado las condiciones."};
}
export async function toggleRule(id:string,enabled:boolean) {
  await requireAdmin();z.string().min(1).max(160).parse(id);z.boolean().parse(enabled);
  try{await prisma.automationRule.update({where:{id},data:{enabled}});}catch{return {ok:false,message:"No se pudo cambiar la regla."};}
  revalidatePath("/automatizaciones");return {ok:true,message:enabled?"Regla activa para futuros cambios de etapa.":"Regla desactivada."};
}
export async function discardDraft(id:string){await requireAdmin();await prisma.automationRun.updateMany({where:{id,status:"DRAFT"},data:{status:"DISCARDED"}});revalidatePath("/automatizaciones");}
