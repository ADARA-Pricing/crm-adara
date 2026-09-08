# Auditoría incremental: embudo, 8 de septiembre de 2026

Base publicada: 114be30. Repositorio limpio al comenzar. Alcance retomado de los dos pedidos originales de auditoría, manteniendo la exclusión del bot.

## Archivos excluidos antes de editar

botpress-agent/**, prisma/**, src/app/api/**, integraciones, auth, sales-policy, order-status, funnel-stages, acciones de embudo/clientes/pedidos/logística y ejecutores de automatizaciones. Se inspeccionó moveFunnelContact en modo lectura: conserva su control de concurrencia y no fue modificado. No se cambian modelos, estados, payloads, reglas ni contratos consumidos por el bot.

## Implementado en esta tanda, sin publicar

- Cinco columnas activas por defecto, conservando retiro físico; Finalizado y Abandonado en vista secundaria.
- Selección de grupo y etapa móvil en URL; los enlaces a una etapa explícita tienen prioridad. Abrir la ficha conserva esos parámetros.
- Columnas más estrechas; desplazamiento acotado al tablero y cabeceras fijas dentro de cada columna.
- CSS móvil con una etapa visible y selector accesible; se conserva el selector existente para mover un contacto.
- Antigüedad basada exclusivamente en lastMessageAt. Si falta, se informa sin inventar actividad.
- Contadores explícitamente referidos a contactos cargados.

## Verificación

195 pruebas aprobadas, incluyendo tres nuevas de presentación; lint, typecheck y build correctos. Revisión autenticada local de escritorio: cinco columnas visibles, vista cerrada con sus dos columnas, apertura de ficha. No se movieron contactos, enviaron WhatsApp, crearon tareas ni modificaron pedidos reales. La vista móvil está implementada pero su comprobación visual específica queda pendiente.

## Pendientes, no considerar cerrado el módulo

- Resuelto en la continuación: paginación de 100 registros con consulta previa por grupo y total real de coincidencias. Los contadores de columnas siguen siendo de la página, explicitado en pantalla.
- Resuelto en la continuación: el formulario GET incluye viewGroup; cambiar grupo reinicia la página. Los enlaces de paginación conservan los filtros comerciales de lectura.
- Deshacer seguro: revisar concurrencia y dependencias antes de incorporar otra escritura de etapa.
- Accesos directos a chat/pedidos y pruebas completas del panel de ficha.
- QA móvil y teclado; prueba interactiva de movimiento únicamente con fixtures aislados.
- Continuar luego fechas/formularios, clientes, pedidos/logística, tareas, cobertura, resultados, productos y Meta Ads en ese orden.

Archivos: src/components/funnel-board.tsx, src/app/embudo/crm-view.tsx, src/app/globals.css, src/lib/funnel-presentation.ts y su test. Sin migraciones, variables de entorno ni dependencias nuevas. No se modificaron prompts, flujos, configuración, contratos ni comportamiento del bot. No se publicó esta tanda.

## Continuación: paginación y conservación de vista

Se modificaron además src/lib/crm-funnel-filters.ts y su test, exclusivamente para consultas administrativas de lectura. Página validada como entero positivo acotado; enlaces anterior/siguiente y recuperación a primera página vacía. Consultas independientes de contactos, total, usuarios y categorías en paralelo.

197 pruebas, lint, typecheck y build aprobados. Revisión autenticada local: 19 contactos activos y 1 cerrado en la muestra; aplicar Filtrar conserva la vista cerrada. No se crearon registros para forzar 100 contactos: navegación de páginas con ese volumen queda pendiente de fixtures. El usuario intentó estrechar el panel, pero la captura recibida sigue siendo de 1280 px; no se considera validado el breakpoint móvil. Sin publicación ni cambios reales de datos.
