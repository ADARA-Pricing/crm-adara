export function PageSkeleton({ title = "Cargando sección" }: { title?: string }) {
  return <section className="workspace" aria-busy="true" aria-label={title}><h1>{title}</h1><p role="status">Preparando la información…</p><div className="metric-grid" aria-hidden="true">{[0, 1, 2, 3].map(i => <div key={i} className="metric skeleton" />)}</div><div className="skeleton skeleton-table" aria-hidden="true" /></section>;
}
