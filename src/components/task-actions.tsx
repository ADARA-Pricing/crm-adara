import { setTaskStatus } from "@/app/tareas/actions";

export function TaskActions({ id, status }: { id: string; status: string }) {
  const next = status === "OPEN" ? ["IN_PROGRESS", "Empezar"] : status === "IN_PROGRESS" ? ["DONE", "Completar"] : status === "DONE" ? ["OPEN", "Reabrir"] : ["OPEN", "Reabrir"];
  return <form action={setTaskStatus.bind(null, id, next[0] as "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED")}><button className="task-action" type="submit">{next[1]}</button></form>;
}
