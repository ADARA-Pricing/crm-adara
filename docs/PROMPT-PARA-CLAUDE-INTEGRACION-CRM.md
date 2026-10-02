# Prompt para Claude — Integrar el CRM Adara en una nueva app

Copiá y pegá el siguiente prompt en Claude junto con acceso de solo lectura al repositorio `ADARA-Pricing/crm-adara` y al archivo `docs/INTEGRACION-NUEVA-APP-CRM.md`.

```text
Actuá como arquitecto e implementador senior. Necesito integrar todas las capacidades del CRM Adara existente en una nueva aplicación que estamos desarrollando.

Repositorio fuente: https://github.com/ADARA-Pricing/crm-adara
Documento de referencia obligatorio: docs/INTEGRACION-NUEVA-APP-CRM.md
Esquema contractual: prisma/schema.prisma

Objetivo
Construí una integración API-first que permita a la nueva app usar clientes, catálogo, pedidos, conversaciones, tareas, logística, cobertura, zonas de riesgo, automatizaciones y marketing del CRM sin duplicar la fuente de verdad ni romper la operación actual.

Reglas no negociables
1. El CRM Adara y su PostgreSQL son la fuente de verdad. No crear una base paralela editable de Customer, Order, Product o Conversation.
2. No acceder a la base desde el frontend. Usar un backend/BFF con autenticación, DTOs tipados, validación y control de permisos.
3. No exponer secretos, URLs con contraseñas, tokens de Botpress, claves Supabase ni firmas de webhooks.
4. No recalcular precios, envío o total en frontend. Usar las reglas y APIs de cotización/confirmación del CRM.
5. Mantener Retiro en Av. Cramer 2548 y envío por mensajería como modalidades válidas.
6. Un pedido confirmado debe quedar PENDING_REVIEW; no saltar a logística o entregado.
7. Preservar etapas del embudo, estados de pedido y roles exactamente como están definidos en Prisma.
8. Nunca usar datos reales, mover leads ni crear pedidos reales para pruebas. Usar mocks/fixtures.
9. Mantener idempotencia y auditoría para mutaciones, especialmente pedidos, mensajes y automatizaciones.
10. No modificar prompts ni el comportamiento de Botpress salvo que el cambio se solicite explícitamente.

Entregables requeridos
1. Revisá el repositorio y producí un mapa de integración: módulos, entidades, relaciones, APIs existentes y huecos de contrato.
2. Proponé la arquitectura de la nueva app (capas UI, BFF, adaptadores CRM, auth, observabilidad y feature flags).
3. Implementá un cliente tipado para las APIs CRM, con DTOs Zod/TypeScript y manejo explícito de errores.
4. Implementá primero las pantallas o servicios de lectura para catálogo, lead/cliente, pedido, conversación y logística.
5. Implementá mutaciones en este orden: notas/asignación/tareas; cotización; confirmación de pedido; control de conversación; logística. Cada una debe validar permisos e idempotencia.
6. Mantener en UI los estados vacíos, loading, error y reintento sin inventar ceros ni datos comerciales.
7. Escribí tests unitarios de contratos, tests de flujos con fixtures y una checklist manual de regresión.
8. Documentá variables de entorno por nombre, sin valores.
9. Prepará un plan de rollout gradual y rollback.

Flujos que se deben verificar
- Cliente pregunta por producto -> catálogo activo -> cotización -> confirmación -> PENDING_REVIEW.
- Envío: captura mínima de dirección/localidad, cobertura y contraentrega.
- Retiro: dirección/horarios vigentes y reglas de pago.
- Conversación: distinguir cliente, bot, operador e interno; respetar ventana de WhatsApp.
- Handoff humano: tarea deduplicada y trazabilidad.
- Logística: validación de riesgo/cobertura, monto a cobrar y etiqueta ZPL solo cuando sea elegible.
- Automatización: no ejecutar seguimiento en envío, retiro, finalizado o abandonado. Un scheduler horario requiere Vercel Pro o alternativa externa segura; no usar Vercel Hobby para cron horario.

Forma de trabajo
- Antes de modificar, listá supuestos y contratos a conservar.
- Hacé cambios pequeños y verificables.
- No reemplaces APIs existentes por accesos directos a BD sin una razón explícita.
- Si una API no tiene un contrato suficiente, proponé y agregá una versión autenticada en lugar de acoplarte a detalles internos.
- Ejecutá typecheck, lint, tests y build al final.
- Entregá: resumen, archivos creados/modificados, decisiones, pruebas, riesgos y pendientes reales.
```
