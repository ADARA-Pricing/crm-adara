"use client";
import React, { useEffect, useState } from "react";
import { operatorInitials } from "@/lib/operator-profile";
const colors: Record<string, string> = { brown: "#5a2f1d", green: "#247a52", blue: "#2e6b9a", purple: "#7652a2" };
export function OperatorAvatar({ name, color = "brown", userId }: { name: string; color?: string; userId?: string }) {
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => { setFailed(false); }, [userId]);
  useEffect(() => { const update = () => { setFailed(false); setVersion(v => v + 1); }; window.addEventListener("crm-avatar-changed", update); return () => window.removeEventListener("crm-avatar-changed", update); }, []);
  return <span aria-hidden="true" style={{ display: "inline-grid", overflow: "hidden", placeItems: "center", flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: colors[color] || colors.brown, color: "white", fontSize: 12, fontWeight: 600 }}>{userId && !failed ?
    // Authenticated same-origin image; no external optimizer or public avatar URL.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/profile/avatar?id=${encodeURIComponent(userId)}&v=${version}`} alt="" width={32} height={32} style={{ objectFit: "cover" }} onError={() => setFailed(true)} /> : operatorInitials(name)}</span>;
}
