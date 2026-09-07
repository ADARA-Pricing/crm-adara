"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="panel" role="alert"><h1>No pudimos cargar esta sección</h1><p>Revisá tu conexión. Si estabas guardando un cambio, verificá su estado antes de repetirlo.</p><button className="button" onClick={reset}>Volver a intentar</button><Link className="button secondary" href="/">Ir al inicio</Link></section>;
}
