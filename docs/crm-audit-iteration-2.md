# Segunda auditoría: plan incremental

## Límites antes de editar

Base: d2c9754, repositorio limpio. Excluidos botpress-agent/**, prisma/**, src/app/api/**, acciones comerciales y de automatizaciones, auth, sincronización/caché de conversaciones, sales-policy, order-status, funnel-stages, cobertura, integraciones y configuración del widget. No se modifican contratos ni datos reales.

## Orden

1. Layout persistente, skeleton interior, menú estable; medir navegación y verificar antes de seguir.
2. Bandeja: layout, filtros progresivos y contexto de operador. Mantener indicador compacto solicitado.
3. Embudo: vistas activas/cerradas y responsive, sin cambiar transiciones.
4. Fechas y formularios: presentación localizada conservando payloads.
5. Clientes: contexto y calidad visual; cambios en campos compartidos pendientes de analizar.
6. Pedidos y logística: lectura, filtros y controles visuales compatibles.
7. Tareas: vistas y formularios sobre contratos existentes.
8. Cobertura: mostrar límites de la fuente; sin inventar CP.
9. Resultados: métricas reales y criterios explícitos.
10. Productos: mejoras administrativas compatibles.
11. Meta Ads: integración independiente de lectura, requiere credenciales propias.
12. Diseño y responsive global; validaciones finales.

## Dependencias pendientes

Automatizaciones existentes reaccionan a cambios de etapa manuales y del bot. Se oculta el acceso del menú como alternativa expresamente autorizada; no se cambian datos, reglas ni ejecutores. Ocultar el menú no desactiva reglas existentes. No se garantiza que todas estén desactivadas.

No publicar sin nueva autorización. No mensajes, tareas, cambios comerciales ni campañas reales durante QA.

## Medición base

Compilación actual servida con next start local. Un clic de Productos a Clientes devolvió la pantalla de carga sin sidebar después de 3033 ms (tiempo observado del control de navegador, no latencia HTTP aislada). Se registrará la misma observación después; no inferir percentiles ni mejora porcentual de una muestra.

## Etapa 1 implementada localmente

Layout autenticado persistente en src/app/(crm)/layout.tsx; skeleton y error con reintento dentro del contenido. Las 22 páginas se mantienen como crm-view.tsx en sus directorios originales y se exponen mediante page.tsx en el grupo (crm). Esto conserva URLs e imports relativos de acciones. Comparación automática con HEAD: contenido de las 22 vistas idéntico. API, acciones, auth y layout raíz con widget intactos.

CrmFrame mantiene selección de menú entre navegaciones, marca rutas de detalle como activas y precarga enlaces. Sidebar y contenido tienen scroll separado; botón de ocultar integrado al encabezado y botón accesible para reabrir. Automatizaciones no figura en el menú; su ruta, datos y ejecución permanecen intactos por la restricción del bot. CrmShell queda como wrapper de compatibilidad, sin repetir la autenticación del layout en cada vista; se conservan todas las guardas propias de páginas y acciones.

Medición posterior: 3027 ms observados para el mismo clic, con sidebar presente y skeleton dentro de main. La diferencia temporal no demuestra aceleración; la mejora comprobada es la persistencia visual. No se agregó caché entre usuarios ni de datos comerciales. Quedan pendientes perfiles de consultas y mediciones estadísticamente útiles.

Validaciones: 170 tests en 24 archivos aprobados, lint, typecheck y build correctos. Pruebas nuevas de estructura semántica, selección de sección activa y exclusión del enlace Automatizaciones. Revisada navegación autenticada y pantalla angosta; Chrome local sin sesión mostró login correcto. No se afirma revisión autenticada de escritorio hasta completar la ampliación del panel local.

Archivos: src/components/crm-frame.tsx y su test, crm-shell.tsx, globals.css; nuevo grupo src/app/(crm), vistas reubicadas sin cambios; loading/error movidos al grupo y loading de Bot al nuevo segmento. Sin migraciones, variables ni dependencias nuevas. No se tocaron prompts, flujos, contratos ni comportamiento del bot. No se publicó. Etapas 2–12 pendientes.

## Verificación ampliada y etapa 2 parcial

El usuario amplió el panel local: revisión autenticada de escritorio completada para el layout (Clientes), con navegación activa y scroll independiente visibles. Se continúa con WhatsApp, sin publicación.

Filtros: Buscar, Responsable, Atención y Caso visibles; Etapa, Categoría, Ventana, Compras y Orden agrupados en details “Más filtros”. Se abre cuando existen condiciones avanzadas y muestra su cantidad. Mismos nombres, valores, GET y parser; sin cambios en consultas o sincronización. Dos pruebas de presentación agregadas.

Filas: nombre y fecha en primera línea, teléfono en segunda, contexto en línea secundaria con truncado y title; preview con texto completo en title. Altura mínima consistente y bolita compacta preservada. Fecha visible argentina. Las reglas y actualización de disponibilidad permanecen intactas.

Validación: 172 pruebas, lint, typecheck y build aprobados. Revisión visual de escritorio de Bandeja y apertura de Más filtros. Se comprobó que las bolitas se actualizan a disponible/vencida después de hidratar; no se enviaron mensajes ni se guardaron datos. Esta tanda aún requiere revisión mobile específica; contadores, tareas laterales y controles de operador siguen pendientes. Archivos adicionales: src/components/inbox-filters.tsx y su test, src/app/bandeja/crm-view.tsx, globals.css. Sin migraciones ni variables nuevas. No se modificaron archivos de lógica, contratos, prompts, flujos o comportamiento del bot.

### Accesos rápidos con contadores

Cuatro accesos: Mis chats, Ventana por vencer, Muy interesados y Sin respuesta. Cada contador usa la misma selección que su enlace y conserva filtros no reemplazados; reinicia página y conversación seleccionada. Consultas de conteo en paralelo dentro de Suspense, sin bloquear la lista principal y con autenticación propia. Fallos se muestran como —, no como cero. No se agrega caché ni se alteran inboxWhere, sincronización o acciones de mensajes.

Archivos: src/components/inbox-shortcuts.tsx, src/lib/inbox-shortcuts.ts y test, bandeja/crm-view.tsx, globals.css. 174 tests, lint, typecheck y build aprobados. Revisión local de contadores reales (0/1/0/0 en la muestra) y distribución angosta de filtros/accesos; sin enviar mensajes ni cambios de datos. Tareas laterales y controles de operador siguen pendientes. No publicado; sin migraciones ni nuevas variables.
