# Integración del CRM Adara en una nueva aplicación

Fecha de referencia: 02/10/2026. Este documento describe el estado real del repositorio `crm-adara` para integrar sus capacidades en otra aplicación sin duplicar datos ni alterar la operación actual.

## 1. Decisión de arquitectura

El **CRM Adara es la fuente de verdad** para clientes, catálogo, pedidos, logística, tareas, conversaciones y trazabilidad comercial.

La nueva aplicación debe integrar mediante una capa backend propia/BFF y las APIs del CRM. No debe escribir directamente en PostgreSQL desde el navegador, ni mantener una segunda copia editable de los pedidos o clientes.

```text
Nueva app (UI)
  -> Backend/BFF de la nueva app
  -> APIs autenticadas del CRM Adara
  -> PostgreSQL (schema crm)
  -> Botpress / WhatsApp, Supabase Auth, Meta Ads
```

Para una integración interna temporal, puede compartir la misma base PostgreSQL **solo desde un backend confiable** y usando Prisma/migraciones coordinadas. La opción recomendada para una app nueva es API-first: reduce acoplamiento al esquema y conserva controles comerciales ya implementados.

## 2. Stack y repositorio

- Repositorio: `https://github.com/ADARA-Pricing/crm-adara`
- Framework: Next.js 15 + React 19 + TypeScript.
- Base de datos: PostgreSQL / Supabase, schema `crm`.
- ORM: Prisma 6 (`prisma/schema.prisma`).
- Auth: Supabase Auth; roles `ADMIN`, `SALES`, `LOGISTICS`.
- Bot: Botpress Cloud; el proyecto del agente está en `botpress-agent/`.
- Hosting actual: Vercel.

Comandos útiles:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Nunca copiar `.env.local`, tokens de Botpress, claves Supabase, URLs con contraseña ni secretos de webhooks a la nueva app, tickets o prompts.

## 3. Dominio de datos que debe preservar

| Entidad | Rol de negocio | Campos/relaciones clave |
|---|---|---|
| `Customer` | Lead/cliente único | WhatsApp, teléfono, nombre, etapa, dirección, localidad, CP, preferencias, responsable, notas, pedidos, tareas y conversaciones. |
| `Conversation` | Conversación por canal | `botpressId`, `channel`, estado, pausa de bot, último entrante/saliente, eventos y caché. |
| `Product` | Catálogo comercial | SKU, precio/ envío en centavos, stock, garantía, especificaciones técnicas, imágenes, disponibilidad para bot. |
| `Order` / `OrderItem` | Venta y operación | Número de venta, receptor, modalidad, pago, entrega, revisión de riesgo, importe, ítems y actividad. |
| `Task` | Seguimiento humano | Tipo, estado, vencimiento, cliente/pedido/responsable. |
| `DeliveryCoverageZone` / `DangerZone` | Cobertura y seguridad | Zona de mensajería y áreas de riesgo geográficas. |
| `FunnelTransition` | Trazabilidad comercial | Cambios de etapa del embudo. |
| `AutomationRule` / `AutomationRun` | Reglas de seguimiento | Reglas por etapa y sus ejecuciones/borradores. |
| `AcquisitionAttribution` / `MetaAdsConnection` | Marketing | Procedencia y conexión cifrada con Meta Ads. |

El esquema completo es la referencia contractual: `prisma/schema.prisma`.

### Estados que no se deben reinterpretar

**Embudo**: `FIRST_CONTACT`, `INTERESTED`, `VERY_INTERESTED`, `COORDINATE_DELIVERY`, `LOCAL_PICKUP`, `COMPLETED`, `ABANDONED`.

**Pedidos**: `DRAFT`, `AWAITING_CUSTOMER_CONFIRMATION`, `PENDING_REVIEW`, `APPROVED_FOR_LOGISTICS`, `PREPARING`, `SHIPPED`, `READY_FOR_PICKUP`, `DELIVERED`, `CANCELLED`.

Un pedido confirmado entra en `PENDING_REVIEW`. No debe pasar directamente a logística sin la revisión comercial/de riesgo.

## 4. Reglas comerciales obligatorias

- El producto activo para bot se toma del catálogo; precio, garantía, stock y envío no se duplican ni se fijan en texto.
- Mensajería: el costo viene de `Product.shippingCents`; la cobertura se valida antes de prometer entrega.
- Contraentrega: efectivo o transferencia al recibir. No seña ni transferencia previa.
- Retiro en local habilitado: Av. Cramer 2548, CABA. Lunes a viernes 10–19 h; sábados 11–15 h.
- Tarjeta en un pago solo para retiro, con recargo; cuotas únicamente por web.
- No hay entregas los domingos. Mencionarlo solo si el cliente pide un domingo.
- Para envío se requiere dirección, localidad, receptor y teléfono; CP y referencia son opcionales salvo necesidad real.
- No mostrar al cliente tareas, IDs, errores internos, estados de revisión, códigos de zona ni detalles de herramientas.
- Cuando un cliente está en `COORDINATE_DELIVERY`, `LOCAL_PICKUP`, `COMPLETED` o `ABANDONED`, no enviar seguimientos comerciales genéricos.

La referencia detallada está en `docs/SALES-RULES.md` y `botpress-agent/src/conversations/index.ts`.

## 5. APIs existentes relevantes

Las rutas viven en `src/app/api`. Validar contrato, autenticación y respuestas antes de consumirlas en producción.

| Ruta | Uso | Seguridad / observaciones |
|---|---|---|
| `POST /api/catalog/product` | Obtiene producto activo apto para el bot, precio, envío, imágenes y ficha técnica normalizada. | Firma Botpress `x-adara-signature`. |
| `POST /api/quotes` | Cotiza por producto, modalidad, pago y localidad opcional. | Validación Zod; la nueva app debe consumirla desde backend autenticado. |
| `POST /api/orders/confirm` | Crea pedido confirmado y cliente/conversación vinculada. | Firma Botpress; crea `PENDING_REVIEW` y calcula importes en servidor. |
| `POST /api/coverage/check` | Valida cobertura por localidad/CP. | Firma Botpress; devuelve `covered` y `requiresManualReview`. |
| `POST /api/address/resolve` | Normaliza dirección argentina y puede deducir localidad. | Firma Botpress o sesión CRM. No reemplaza la validación de cobertura. |
| `POST /api/handoffs` | Deriva a atención humana y crea tarea deduplicada. | Firma Botpress. |
| `POST /api/leads/stage` | Actualiza etapa/datos comerciales del lead. | Revisar body y control de firma antes de integrar. |
| `GET/POST /api/leads/[id]/detail` | Lectura/edición puntual de lead. | Sesión CRM. |
| `POST /api/conversations/control` | Pausa/reactiva control de bot. | Sesión CRM. |
| `POST /api/inbox/messages` | Lectura/sincronización de mensajes. | Sesión CRM. |
| `POST /api/inbox/reads` | Guarda lectura del operador. | Sesión CRM. |
| `GET /api/logistica/etiquetas` | Genera etiquetas ZPL elegibles. | Sesión CRM y datos operativos completos. |
| `POST /api/webhooks/botpress` | Endpoint de eventos Botpress. | Firma HMAC; hoy valida y confirma el evento, no es un reemplazo de toda la sincronización. |

### Reglas de seguridad para la nueva app

1. No llamar rutas Botpress-firmadas desde el browser ni exponer la firma.
2. Crear endpoints BFF autenticados en la nueva app o reutilizar el backend CRM.
3. Validar payload con Zod/DTOs y usar idempotencia en mutaciones de pedidos o envíos.
4. Nunca permitir que la nueva UI modifique precio, total, `saleNumber`, estados finales o cobertura sin una validación de servidor.
5. Registrar actor, fecha y motivo para cambios sensibles.

## 6. Flujos que debe reutilizar la nueva app

### Venta por WhatsApp

1. Identificar/crear `Customer` y `Conversation` con WhatsApp.
2. Consultar catálogo activo.
3. Cotizar siempre en servidor (`/api/quotes`).
4. Si elige envío: solicitar solamente datos faltantes y validar cobertura.
5. Presentar resumen y obtener confirmación explícita.
6. Confirmar con `/api/orders/confirm`.
7. Mostrar número de venta solo si el backend confirma creación.
8. Dejar el pedido en revisión; el flujo humano continúa en CRM.

### Retiro en local

Mantenerlo como opción real, no como fallback oculto. Informar dirección/horario, aplicar reglas de pago y crear pedido con `deliveryMethod: PICKUP` al confirmar.

### Logística

La nueva app puede mostrar pedidos, pero debe conservar:

- fecha y franja acordadas;
- receptor, teléfono, dirección/localidad/CP;
- monto a cobrar;
- revisión de riesgo y zonas peligrosas;
- etiqueta ZPL solo para pedidos elegibles;
- transición de estado registrada, sin saltos arbitrarios.

## 7. Conversaciones y Botpress

- La fuente de mensajes en vivo es Botpress; el CRM guarda actividad, eventos y una caché reciente para operación.
- `Conversation.lastIncomingAt` y `lastOutgoingAt` determinan la ventana de WhatsApp y deben actualizarse con mensajes reales, nunca con una pantalla abierta o un cambio de etapa.
- Antes de envío humano, el CRM valida la ventana de 24 horas y la pausa del bot.
- Diferenciar origen: cliente (`incoming`), bot, operador CRM y evento interno.
- El agente vigente tiene instrucciones comerciales y evaluaciones en `botpress-agent/`.

### Seguimiento automático de 12 horas

La lógica preparada vive en `src/lib/automated-follow-up.ts` y la ruta en `src/app/api/cron/follow-ups/route.ts`. Está diseñada para:

- esperar 12 h desde nuestro último mensaje;
- enviar solo una vez;
- ejecutarse lunes a viernes de 8 a 18 h Argentina;
- revalidar que no haya respuesta del cliente;
- excluir coordinación de envío, retiro, finalizado y abandonado.

No activar un scheduler horario en Vercel Hobby: ese plan solo permite cron diario. Para activarlo correctamente usar Vercel Pro o un scheduler externo seguro que invoque la ruta con `CRON_SECRET`.

## 8. Plan de migración recomendado

1. Definir si la nueva app será una UI adicional o reemplazará módulos del CRM.
2. Crear una capa de cliente API tipada basada en contratos de este documento.
3. Implementar primero lectura: catálogo, cliente, pedido, conversación y logística.
4. Luego mutaciones de bajo riesgo: notas, asignación y tareas con auditoría.
5. Integrar cotización y confirmación de pedido usando APIs existentes; no recalcular importes en frontend.
6. Integrar Botpress mediante backend, conservando firma e idempotencia.
7. Ejecutar pruebas con fixtures/mocks; nunca mover leads o crear pedidos reales para probar.
8. Hacer rollout por módulo con feature flag y plan de rollback.

## 9. Variables de entorno a provisionar (nombres, nunca valores)

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Variables privadas de Supabase para backend, si aplica
- `BOTPRESS_API_TOKEN`
- `BOTPRESS_BOT_ID`
- `BOTPRESS_WORKSPACE_ID`
- Secreto de firma webhook Botpress
- `CRM_ADMIN_EMAIL`
- `CRON_SECRET` si se activa el scheduler
- Variables de Meta Ads si la nueva app integra marketing

## 10. Criterios de aceptación

- No se duplican clientes, pedidos ni conversaciones.
- Los importes se calculan una sola vez en servidor.
- Los permisos respetan `ADMIN`, `SALES` y `LOGISTICS`.
- Retiro en local y mensajería siguen disponibles.
- Los filtros y la trazabilidad de CRM no pierden datos.
- Los mensajes manuales o automáticos no se envían fuera de la ventana autorizada.
- Las operaciones mutables son idempotentes y auditables.
- TypeScript, lint, tests y build pasan antes de publicar.
