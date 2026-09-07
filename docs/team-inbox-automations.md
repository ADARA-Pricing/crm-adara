# Equipo, filtros comerciales y reglas

## Atención y ventana

Conversation.lastIncomingAt/lastOutgoingAt se derivan de mensajes reales de Botpress
(cache existente al migrar + lecturas/sincronización de la bandeja). Nunca de
Customer.lastMessageAt, updatedAt, saludo automático ni cambio de etapa.
Las actualizaciones SQL usan GREATEST para no retroceder con páginas antiguas.
Un envío humano aceptado registra lastOutgoingAt, no entrega ni lectura.
Sin fecha entrante: Sin verificar, no ventana vencida. Webchat: Otro canal.
Ventana abierta usa > ahora-24h; exactamente 24h está vencida. UI renueva cada 30s.
El envío siempre verifica otra vez con Botpress, requiere pausa y conserva su
reserva idempotente. Filtrar no autoriza ni dispara mensajes.

Filtros combinados en SQL antes de paginar: texto, etapa, categoría, responsable,
ventana (incluye vence en 2h), atención, compras concretadas, caso abierto/cerrado.
Pendiente compara último entrante contra último saliente (bot o humano); no es
estado de lectura. “Ya compró” significa Order.DELIVERED, incluido retiro.
50 chats/página, total exacto. Se sincronizan en lotes los chats de la página y los
80 recientes incluso si un filtro los oculta. Los datos pueden tener demora de
sincronización; el indicador no sustituye la validación al enviar.

## Responsables y tareas

Responsable del lead independiente del responsable de tarea y de botPaused.
Asignación optimista, miembro activo verificado, nota interna con autor.
Filtros Mis clientes/Sin asignar en embudo y bandeja; tareas vencidas/próximas/mías.
Desde la ficha: completar, cancelar, reabrir, reasignar, cambiar vencimiento (AR).
Actualizar tarea verifica cliente + versión para evitar pisar cambios concurrentes.
Asignar no envía notificaciones externas ni pausa el bot automáticamente.

## Resultados

Cohorte de clientes creados en últimos 7/30 días; conversión = esos clientes con
al menos una venta DELIVERED / clientes de la cohorte. Categorías son intereses
multivaluados, no atribución de categoría del producto comprado. Distribución actual
no es historial. FunnelTransition registra cambios nuevos desde la migración.

## Automatizaciones (fase de revisión)

Administrador crea/edita reglas desactivadas y las habilita explícitamente.
Disparador SQL transaccional AFTER INSERT/UPDATE de funnelStage aplica a CRM,
bot y logística. Mismo valor de etapa no se repite. Reingreso real sí ejecuta.
Categoría opcional se evalúa contra intereses presentes al cambio.
TASK crea seguimiento con vencimiento relativo; responsable activo del lead o null.
MESSAGE_DRAFT guarda borrador y no realiza llamadas externas.
No hay cron, envío automático ni plantillas fuera de 24h en esta fase.
El usuario debe revisar borrador, pausar bot, usarlo y pulsar Enviar.
Reserva human-draft-ID impide un segundo intento remoto del mismo borrador aunque
cambie el UUID de la UI. Resultado incierto no se reintenta automáticamente.
No se equipara ACCEPTED con entregado/leído. Desactivar regla no borra ejecuciones.

Prueba SQL con fixtures y ROLLBACK verifica reglas desactivadas, categoría, tarea,
borrador, historial y no duplicación por guardar la misma etapa.
Migración solo crm; no modifica public/Pricing. No se activan reglas reales en QA.
