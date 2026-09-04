import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { BotpressWebchat } from "@/components/botpress-simulator";

export const metadata: Metadata = {
  title: "CRM Adara",
  description: "CRM comercial conectado a Botpress y WhatsApp"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}<BotpressWebchat /></body>
    </html>
  );
}
