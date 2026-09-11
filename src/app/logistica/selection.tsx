"use client";
import { createContext, useContext, useState } from "react";
import { LabelDownload } from "./label-download";
const Selection = createContext<{ selected: string[]; toggle: (id: string) => void }>({ selected: [], toggle: () => {} });
export function LogisticsSelection({ ids, children }: { ids: string[]; children: React.ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const visible = selected.filter(id => ids.includes(id));
  return <Selection.Provider value={{ selected: visible, toggle: id => setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]) }}><div className="shipment-selection"><label><input type="checkbox" checked={!!ids.length && visible.length === ids.length} disabled={!ids.length} onChange={e => setSelected(e.target.checked ? ids : [])} /> Seleccionar las ventas de esta vista</label><span>{visible.length} seleccionadas</span><LabelDownload ids={visible} /><small>Máximo 50 etiquetas · Zebra 10 × 15 cm. Descargar no modifica pedidos.</small></div>{children}</Selection.Provider>;
}
export function ShipmentCheckbox({ id, saleNumber, disabled = false }: { id: string; saleNumber: number; disabled?: boolean }) {
  const context = useContext(Selection);
  return <label className="shipment-checkbox"><input type="checkbox" aria-label={`Seleccionar venta ${saleNumber}`} checked={context.selected.includes(id)} disabled={disabled} onChange={() => context.toggle(id)} /><span className="sr-only">Seleccionar venta {saleNumber}</span></label>;
}
