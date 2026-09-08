"use client";
import { createContext, useContext, useState } from "react";
const Selection = createContext<{ selected: string[]; toggle: (id: string) => void }>({ selected: [], toggle: () => {} });
export function LogisticsSelection({ ids, children }: { ids: string[]; children: React.ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const visible = selected.filter(id => ids.includes(id));
  return <Selection.Provider value={{ selected: visible, toggle: id => setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]) }}><div className="shipment-selection"><label><input type="checkbox" checked={!!ids.length && visible.length === ids.length} disabled={!ids.length} onChange={e => setSelected(e.target.checked ? ids : [])} /> Seleccionar las ventas de esta vista</label><span>{visible.length} seleccionadas</span><small>Etiquetas ZPL: próximamente. Seleccionar no modifica pedidos.</small></div>{children}</Selection.Provider>;
}
export function ShipmentCheckbox({ id, saleNumber }: { id: string; saleNumber: number }) {
  const context = useContext(Selection);
  return <input type="checkbox" aria-label={`Seleccionar venta ${saleNumber}`} checked={context.selected.includes(id)} onChange={() => context.toggle(id)} />;
}
