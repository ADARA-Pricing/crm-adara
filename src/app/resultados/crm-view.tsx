import Link from "next/link";
import { CrmShell } from "@/components/crm-shell";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { funnelStages } from "@/lib/funnel-stages";
export const dynamic="force-dynamic";
export default async function Results({searchParams}:{searchParams:Promise<{days?:string}>}) {
  await requireCrmUser(); const days=(await searchParams).days==="7"?7:30;const now=new Date();const since=new Date(now.getTime()-days*86400000);
  const cohort={archivedAt:null,createdAt:{gte:since,lte:now}};
  const [leads,buyers,stages,categories,transitions]=await Promise.all([
    prisma.customer.count({where:cohort}),
    prisma.customer.count({where:{...cohort,orders:{some:{status:"DELIVERED",deliveredAt:{lte:now}}}}}),
    prisma.customer.groupBy({by:["funnelStage"],where:cohort,_count:true}),
    prisma.product.findMany({where:{category:{not:null}},distinct:["category"],select:{category:true}}),
    prisma.funnelTransition.groupBy({by:["toStage"],where:{createdAt:{gte:since,lte:now}},_count:true}),
  ]);
  const rows=await Promise.all(categories.map(async c=>({name:c.category!,total:await prisma.customer.count({where:{...cohort,interestCategories:{has:c.category!}}}),buyers:await prisma.customer.count({where:{...cohort,interestCategories:{has:c.category!},orders:{some:{status:"DELIVERED",deliveredAt:{lte:now}}}}})})));
  return <CrmShell active="/resultados"><header className="topbar"><div><p className="eyebrow">Medición comercial</p><h1>Resultados</h1><p>Clientes ingresados en los últimos {days} días y compras concretadas hasta hoy.</p></div></header><div className="topbar-actions"><Link href="/resultados?days=7">7 días</Link><Link href="/resultados?days=30">30 días</Link></div><section className="metric-grid">{[["Clientes nuevos",leads],["Clientes que compraron",buyers],["Conversión de esta cohorte",leads?`${(buyers/leads*100).toFixed(1)}%`:"Sin datos"]].map(([label,value])=><article className="metric" key={label}><span>{label}</span><strong className="metric-value">{value}</strong></article>)}</section><section className="panel"><h2>Etapa actual de esos clientes</h2>{funnelStages.map(([stage,label])=><p key={stage}>{label}: {stages.find(s=>s.funnelStage===stage)?._count||0}</p>)}<p>Una etapa actual no demuestra por cuáles etapas pasó el cliente. “Abandonado” refleja la clasificación del CRM, no una causa de pérdida inferida.</p></section><section className="panel"><h2>Conversión por interés</h2>{rows.map(r=><p key={r.name}>{r.name}: {r.buyers} compradores / {r.total} interesados · {r.total?`${(r.buyers/r.total*100).toFixed(1)}%`:"Sin datos"}</p>)}<p>Un cliente puede figurar en varias categorías. Se mide si compró, no si compró un producto de esa misma categoría.</p></section><section className="panel"><h2>Entradas a etapas registradas</h2>{transitions.map(t=><p key={t.toStage}>{funnelStages.find(([s])=>s===t.toStage)?.[1]}: {t._count}</p>)}<p>Historial disponible desde la instalación de esta mejora. Incluye reingresos; no son clientes únicos. No reconstruimos movimientos anteriores.</p></section></CrmShell>;
}
