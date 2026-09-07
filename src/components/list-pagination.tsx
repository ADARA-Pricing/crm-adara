import Link from "next/link";
import { listUrl, type ListQuery } from "@/lib/crm-list-filters";
export function ListPagination({ path, query, page, total }: { path: string; query: ListQuery; page: number; total: number }) {
  return <nav className="bot-date-form" aria-label="Paginación"><span>{total} {total === 1 ? "resultado" : "resultados"} · Página {page} de {Math.max(1, Math.ceil(total / 50))}</span>{page > 1 && <Link className="button secondary" href={listUrl(path, query, page - 1)}>Anterior</Link>}{page * 50 < total && <Link className="button secondary" href={listUrl(path, query, page + 1)}>Siguiente</Link>}</nav>;
}
