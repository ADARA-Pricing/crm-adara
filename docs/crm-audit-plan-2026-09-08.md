# Auditoría integral, nueva iteración

Base: 8911053. Repositorio limpio antes de empezar. Pedido completo leído desde el adjunto ed878545-cf58-4666-8dc9-5b5fdbbc2767.

## Límites y dependencias identificadas antes de editar

Excluidos: botpress-agent/**, webhooks, /api/handoffs, /api/leads, /api/orders, /api/catalog, /api/coverage, reglas y triggers de automatización, contratos del bot, estados y configuración comercial. Sin cambios de datos reales, envío de WhatsApp, fusiones, campañas ni despliegue.

Task carece de conversación, motivo estructurado, origen, idempotencia, contador de repeticiones e historial propios. La deduplicación de /api/handoffs compara descripción exacta y crea la tarea fuera de una operación atómica de deduplicación: una descripción distinta o dos solicitudes concurrentes pueden producir tareas similares. Ese endpoint lo consume el bot y queda pendiente, no se modifica.

La migración 20260907143000 crea capture_funnel_transition, que puede crear tareas al cambiar etapas si hay reglas habilitadas. Cambiar ese trigger afectaría automatizaciones del bot: excluido. No se verificó ni modificó el estado real de reglas en la base.

## Plan ordenado

1. Duplicados: detección de solo lectura primero. Diseñar historial e idempotencia independientes para escrituras manuales del CRM; no unificar automáticamente registros históricos. Fusión explícita requiere analizar el impacto de cerrar tareas que también consulta la operación de pedidos.
2. Asignación: en envío manual confirmado, asignación condicional solo si no existe responsable, con auditoría atómica; controles separados de pausa/reactivación. La conversación hoy no tiene responsable independiente, depende del cliente: documentar antes de ampliar.
3. Rendimiento: medir rutas y consultas, eliminar duplicación y paralelizar sin cachear sesiones entre usuarios.
4. Completar Tareas y fechas reutilizables.
5. Bandeja/Embudo, Clientes, Pedidos/Logística, Cobertura, Resultados, Meta Ads y Productos en el orden pedido.
6. QA 1366/1024/768/390, teclado, errores, permisos, pruebas y build por tanda. No afirmar mediciones ni revisión visual no realizadas.

## Primera tanda: detección no destructiva

Se comparan tareas activas vinculadas al mismo cliente o pedido, con el mismo tipo y título normalizado, dentro de una ventana configurable. Se indica siempre «Posible duplicado»: no confirma equivalencia ni supone que pertenecen a la misma conversación. Las descripciones quedan desplegables; no se sobrescriben detalles, vencimientos o responsables. Revisión limitada a las 1000 tareas activas más recientes con advertencia explícita si hay más. Panel comparativo y enlaces cruzados pendientes.

Configuración opcional del servidor: CRM_TASK_DUPLICATE_WINDOW_HOURS (predeterminado 24; entero de 1 a 720). Solo afecta sugerencias visuales, no creación de tareas ni bot.

Pendientes: prevención concurrente/idempotencia de tareas manuales, incorporación de metadatos independientes e historial, fusión manual, asignación automática, resto del plan. Los requisitos que necesitan tocar contratos o triggers excluidos quedan documentados, no implementados.

## Asignación automática parcial implementada

Tras confirmar un mensaje manual, dentro de la misma transacción del CRM, updateMany asigna el cliente únicamente si assigneeId sigue siendo null. Se registra LEAD_ASSIGNED con usuario, origen y responsable. Un cliente ya asignado no cambia; no se asigna antes del envío ni ante respuesta incierta. Sin cambios a pausa, reactivación, derivación, webhook o configuración del bot.

Se preserva el esquema actual: las conversaciones muestran el responsable de su cliente. No existe una asignación independiente por conversación. Pendientes controles Asignarme/Liberar, selección masiva y advertencias de atención simultánea. Sin migraciones ni escrituras reales durante pruebas.

Pruebas agregadas: cuatro de detección conservadora y ventana; tres de asignación manual confirmada, conservación de otro responsable y fallo de envío. Son pruebas aisladas con mocks, no una prueba de carreras contra PostgreSQL real. No se afirma idempotencia o fusión completa de tareas ni mejora de rendimiento medida.
