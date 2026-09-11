"use client";

import { useMemo, useRef, useState } from "react";

const isoPattern = /^\d{4}-(\d{2})-(\d{2})$/;
const displayPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function isoToArgentineDate(value: string) {
  const match = value.match(isoPattern);
  return match ? `${match[2]}/${match[1]}/${value.slice(0, 4)}` : "";
}

export function argentineDateToIso(value: string) {
  const match = value.trim().match(displayPattern);
  if (!match) return "";
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(`${iso}T12:00:00-03:00`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? "" : iso;
}

export function ArgentineDateInput({ name, defaultValue = "", required = false, min, max, id, ariaLabel }: { name: string; defaultValue?: string; required?: boolean; min?: string; max?: string; id?: string; ariaLabel?: string }) {
  const [display, setDisplay] = useState(() => isoToArgentineDate(defaultValue));
  const [iso, setIso] = useState(defaultValue);
  const [invalid, setInvalid] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const normalize = (value: string) => {
    const normalized = argentineDateToIso(value);
    setInvalid(Boolean(value) && !normalized);
    setIso(normalized);
  };
  const message = useMemo(() => invalid ? "Ingresá una fecha válida con formato dd/mm/aaaa." : undefined, [invalid]);
  return <span className="argentine-date-control"><input id={id} value={display} inputMode="numeric" autoComplete="off" placeholder="dd/mm/aaaa" aria-label={ariaLabel} aria-invalid={invalid || undefined} aria-describedby={message ? `${id || name}-error` : undefined} onChange={event => { setDisplay(event.target.value); normalize(event.target.value); }} onBlur={() => { if (iso) setDisplay(isoToArgentineDate(iso)); }} /><input name={name} type="hidden" value={iso} required={required} /><input ref={picker} className="argentine-date-picker" type="date" tabIndex={-1} min={min} max={max} value={iso} onChange={event => { setIso(event.target.value); setDisplay(isoToArgentineDate(event.target.value)); setInvalid(false); }} /><button type="button" className="argentine-date-calendar" aria-label="Abrir calendario" onClick={() => picker.current?.showPicker?.()}>▣</button>{message ? <small id={`${id || name}-error`} role="alert">{message}</small> : null}</span>;
}
