# Auditoría CRM — 07/09/2026

## Límite obligatorio, identificado antes de editar

Se excluyen `botpress-agent/**`, todas las rutas `src/app/api/**`, `prisma/**`, variables de entorno, `src/lib/sales-policy.ts`, `coverage.ts`, `botpress.ts`, `webhook-auth.ts`, `funnel-stages.ts`, `order-status.ts`, `order-review.ts`, sincronización/caché de conversaciones y acciones de servidor de productos, clientes, pedidos, embudo, bandeja y automatizaciones. No cambiar contratos, enums, triggers ni datos comerciales. `conversation-chat.tsx` admite exclusivamente cambios de presentación del historial; conservar envío, pausa y sincronización sin cambios. El panel Bot admite presentación, no consultas ni configuración del agente.

## Arquitectura y diagnóstico inicial

- Next.js App Router / React 19, Prisma/PostgreSQL esquema crm, Supabase Auth, CSS propio.
- Rutas operativas: dashboard, bandeja, clientes/ficha, embudo/ficha modal, pedidos/alta/revisión/ficha, logística, cobertura, tareas, productos/alta/edición/ficha, resultados, bot y automatizaciones.
- Las APIs de catálogo, cotización, confirmación, handoff, etapa y webhook son contratos del bot. El trigger de etapas también ejecuta reglas: quedan congelados.
- Autenticación mediante middleware y `requireCrmUser`; administración mediante `requireAdmin`. No ampliar acceso. Consultas nuevas deben autenticar antes de leer.
- Árbol Git inicialmente limpio. 120 pruebas iniciales aprobadas. Lint inicial no configurado (asistente interactivo); build inicial en validación.
- Problemas comprobados: dashboard imprime enums, fechas dependen de zona del servidor, clientes usa ID de conversación como teléfono, Markdown crudo, bandeja/tablero/formularios anchos, falta estado de error global.
- No existe integración Meta Ads ni variables Meta referenciadas en el código. No reutilizar credenciales de WhatsApp para publicidad.

## Plan progresivo

1. Base visual accesible, navegación, formatos de presentación, Markdown seguro y pruebas.
2. Listados y filtros exclusivamente de lectura, dashboard, estados de carga/error, catálogo administrativo y cobertura.
3. Meta Ads: estado de configuración honesto; integración real pendiente de credenciales y permisos independientes.
4. Pruebas, typecheck, lint, build y revisión visual local; sin despliegue ni datos reales de prueba.

## Dependencias que NO se implementarán sin revisión

- Normalización persistente del teléfono, categorías, nuevos campos/stock/precios, cambios de estado, validaciones o transiciones de pedidos compartidas con el bot.
- Automatizaciones, nuevas reglas o triggers; no habilitar mensajes automáticos.
- No leídos, prioridad, etiquetas y auditoría universal requieren definir almacenamiento CRM aislado y semántica; no confundir sin respuesta con no leído.
- Nuevos contratos de entrega/retirante, responsable o cobertura requieren revisar consumidores antes de migrar. Retiro en Av. Cramer y condiciones existentes permanecen.
- Métricas de atribución, preguntas sin respuesta, entregabilidad y ROAS no se infieren si no existen datos fiables.
- Meta Ads: pendiente conexión publicitaria de solo lectura, permisos, versión de API y credenciales propias; no modificar campañas ni usar datos ficticios.

## Publicación

Cambios exclusivamente locales. Sin migraciones, sin escritura de clientes/pedidos durante pruebas y sin envío de WhatsApp. No publicar ni desplegar sin autorización nueva.

## Entrega parcial: primera etapa

- General: navegación plegable, salto al contenido, foco visible, mayor legibilidad, tablas con scroll acotado, ajustes de grillas/bandeja/formularios, skeleton y error recuperable. Falta revisión visual autenticada desktop/mobile; no se declara aceptación responsive final.
- WhatsApp: Markdown limitado seguro (negritas, listas, enlaces y saltos) renderizado con React, sin HTML. Solo presentación; contenido, lectura, envío, pausas y sincronización sin cambios. Altura del historial ajustada al contenido.
- Clientes: sin IDs de conversación como teléfono en listado/ficha; normalización solo visual; fechas argentinas y fallback traducido. Edición, duplicados y filtros ampliados pendientes.
- Dashboard: fecha de corte calculada en Argentina y traducciones de estados. Métricas/alertas adicionales pendientes.
- Productos: búsqueda por nombre/SKU/categoría y filtro de actividad; sin cambios de estructura ni disponibilidad. Campos extra, imágenes y editor estructurado pendientes de revisión de contrato.
- Cobertura: búsqueda por nombre y aviso explícito de ausencia de CP en el modelo actual. Sin nuevas zonas ni sincronizaciones. Búsqueda por CP pendiente de dependencia.
- Pedidos/logística: ajustes visuales globales, fechas visibles y nombre de retiro; sin cambios de validación, aprobación o transición. Filtros, CSV y mejoras operativas adicionales pendientes.
- Tareas/embudo: ajustes de layout compartidos; sin lógica nueva. Seguimiento extendido, filtros y auditoría siguen pendientes.
- Bot: skeleton de carga únicamente; no nuevas métricas ni cambios de integración.
- Meta Ads: menú/pantalla administrativa de integración pendiente; no se implementó cliente API ni credenciales, no hay datos ficticios.

### Validación

127 pruebas aprobadas (120 existentes + 7 de presentación/seguridad), ESLint sin errores ni warnings, typecheck y build aprobados. Dos fixtures de pruebas existentes recibieron tipado explícito; acciones intactas. La herramienta de build reporta avisos de caché Webpack y Vitest avisa de su API CJS; no son errores de la aplicación. La instalación de herramientas de lint reportó 10 avisos de vulnerabilidades npm; no se ejecutó `audit fix` ni una actualización masiva de dependencias. Revisión de dependencias pendiente antes de publicar.

La revisión en navegador local se intentó usando la habilidad de navegador, pero el middleware no puede inicializar Supabase: faltan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el entorno local. Se necesita configuración local y acceso autorizado para verificar cada ruta. No se modificó autenticación ni se copió sesión/credenciales. Servidor de desarrollo detenido tras la comprobación.

### Archivos modificados o agregados

- Herramientas: `.gitignore`, `.eslintrc.json`, `package.json`, `package-lock.json`.
- Documentación: `docs/crm-ui-audit.md`.
- Presentación compartida: `src/lib/crm-display.ts`, `src/lib/crm-display.test.ts`, `src/components/safe-message.tsx`, `src/components/page-skeleton.tsx`, `src/components/navigation-toggle.tsx`, `src/components/crm-shell.tsx`, `src/app/globals.css`.
- Rutas: `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/page.tsx`, `src/app/marketing/page.tsx`, `src/app/bot/loading.tsx`, `src/app/bandeja/conversation-chat.tsx`, `src/app/clientes/page.tsx`, `src/app/clientes/[id]/page.tsx`, `src/app/cobertura/page.tsx`, `src/app/productos/page.tsx`, `src/app/pedidos/page.tsx`, `src/app/logistica/page.tsx`.
- Fixtures: `src/app/pedidos/nuevo/actions.test.ts`, `src/app/pedidos/review.test.ts`.

Migraciones: ninguna. Variables nuevas: ninguna. No se modificaron prompts, flujos, configuración ni lógica de comportamiento del bot. No se completó todavía la totalidad de los criterios de aceptación del pedido integral.

## Continuación con sesión local autorizada

Se configuraron únicamente `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` (ignorado por Git), con autorización expresa. El usuario inició sesión y se verificó acceso al CRM.

Revisión autenticada en panel angosto: dashboard, clientes, embudo, bandeja, pedidos, revisión comercial, logística, productos, cobertura, tareas, panel Bot y Meta Ads. Se verificó Markdown sobre mensajes almacenados y una búsqueda sin coincidencias de cobertura. No se enviaron formularios comerciales, mensajes ni cambios de etapa. Queda pendiente revisión completa desktop/tablet y fichas/formularios restantes.

Correcciones encontradas: menú accesible al principio y plegado inicial en pantalla angosta; nombres de perfil WhatsApp en dashboard y selectores de Tareas; actividad sin fecha ordenada al final del dashboard; fechas argentinas en tarjetas de embudo y tareas; controles checkbox alineados; estados vacíos de cobertura/productos distinguen filtros sin coincidencias de una base sin registros. Archivos adicionales: `src/app/embudo/page.tsx`, `src/app/tareas/page.tsx`.

Limitación local mantenida: no se configuraron `BOTPRESS_API_TOKEN` ni `BOTPRESS_BOT_ID`; la interfaz muestra los mensajes cacheados, pero la actualización en vivo informa configuración pendiente. No se alteró esta integración ni se copiaron secretos. El panel Bot conserva su estado sin datos externos; no se simulan métricas.

## Listados operativos: segunda etapa

### Buscador global

Ruta autenticada `/buscar`, enlazada desde el menú. Búsqueda de solo lectura sobre Clientes (incluye nombre de perfil y teléfono), Pedidos (número de venta/receptor/cliente), Productos (nombre/SKU/categoría) y Conversaciones por datos del cliente. No busca dentro de mensajes ni llama a Botpress. Selecciones explícitas y máximo 10 resultados visibles por sección; consulta un registro adicional para avisar si existen más. Sin cache compartida ni cambios de permisos, modelos, APIs o datos.

Archivos nuevos: `src/app/buscar/page.tsx`, `src/lib/crm-search.ts`, `src/lib/crm-search-server.ts` y sus dos archivos de pruebas. Menú en `src/components/crm-shell.tsx` y estilos de resultados en `src/app/globals.css`. Autenticación previa a consultas, entrada acotada y números de venta dentro del rango entero. 158 pruebas aprobadas, lint/typecheck; revisión local de Walter y consulta sin coincidencias. No se afirma búsqueda de texto completo de chats.

### Embudo: filtros de vista

Se agregan búsqueda por nombre/perfil/teléfono/localidad, modalidad, antigüedad del último mensaje registrado (7/30 días o sin fecha) y etapa visible. Conserva categoría y responsable. El total de coincidencias se informa separadamente de las hasta 100 tarjetas mostradas; no se presume que una fecha ausente sea actividad antigua. Una etapa visible usa una columna adaptable al ancho.

Nuevos archivos `src/lib/crm-funnel-filters.ts` y `src/lib/crm-funnel-filters.test.ts`; cambios de consulta en `src/app/embudo/page.tsx` y presentación exclusivamente en `src/components/funnel-board.tsx`/CSS. La función de movimiento, acciones, enums y APIs quedan intactos. 151 pruebas aprobadas, lint/typecheck y revisión local de opciones de filtros. Sin movimientos de contactos reales durante QA.

### Dashboard y agenda

### Logística: consulta operativa

Filtros de solo lectura por receptor/teléfono/localidad/responsable, modalidad, estado activo, fecha programada y agenda (hoy, fecha anterior a hoy o sin programar). Orden por fecha programada y desempate estable. Fecha solicitada, programada, franja y teléfono visibles por separado; acceso a ficha de venta. Aviso de fecha anterior a hoy pide verificar, sin asumir incumplimiento ni cambiar el pedido. Fechas por calendario argentino. Contadores de la selección explícitos.

Archivos: `src/lib/crm-logistics-filters.ts`, `src/lib/crm-logistics-filters.test.ts`, `src/app/logistica/page.tsx` y estilo `.logistics-overdue`. Se conservan formulario/acción de guardado, estados, contratos y condiciones. 147 pruebas aprobadas, lint y typecheck. Verificación local con pedido existente sin fecha y búsqueda sin coincidencias; no se modificaron pedidos reales.

Dashboard: accesos a conversaciones abiertas y pedidos para revisar; conteos enlazados de tareas vencidas, hoy (calendario argentino) y próximos siete días. Accesos a chats por vencer, sin respuesta y clientes sin responsable. No se inventa un indicador de no leídos ni se modifica ninguna regla automática.

Tareas: nuevas vistas de lectura Hoy y Completadas. Condiciones compartidas con el dashboard mediante `src/lib/crm-task-filters.ts`, con pruebas en `src/lib/crm-task-filters.test.ts`. Las acciones de crear/completar/reabrir no se modifican. Verificación local de dashboard con cero tareas y enlace a Hoy; no se crearon tareas reales para probar.

- Clientes: filtros combinables por texto (incluye nombre de perfil WhatsApp), etapa, responsable y existencia de pedidos; orden y paginación de 50 con conteo real. Etapa y responsable visibles. No confundir existencia de pedidos con compras entregadas.
- Pedidos: búsqueda por número de venta, cliente/receptor o teléfono; estado, modalidad, fechas de venta y orden. Rango de calendario argentino inclusivo y validación de fechas imposibles/invertidas. Total de toda la selección, no solo de la página; se aclara que no representa cobros. Paginación de 50.
- Regreso desde las fichas a los listados conservando filtros/página. Retorno limitado al listado de origen; no acepta destinos externos. No se garantiza restauración de scroll desde el enlace de regreso.
- Nuevos archivos: `src/lib/crm-list-filters.ts`, `src/lib/crm-list-filters.test.ts`, `src/components/list-pagination.tsx`. Modificaciones adicionales de presentación: listados y fichas de Clientes/Pedidos. Sin acciones de escritura, APIs ni migraciones nuevas.
- Pruebas de filtros, fechas, paginación y retorno seguro. Revisión local autenticada de búsqueda Walter (1 resultado), total de Pedidos y formulario de rango invertido. Pruebas sin modificaciones de clientes/pedidos.

## Seguridad y permisos: revisión inicial (7 de septiembre)

Antes de editar se mantuvieron excluidos botpress-agent, APIs, modelos Prisma, acciones comerciales, integraciones y configuración del bot. Cambios de esta etapa: guardas de acceso de páginas administrativas y pruebas de autenticación; ninguna modificación de datos reales.

- Las fichas de Productos y Pedidos consultaban la base antes de renderizar CrmShell, que comprueba la sesión. Se agregó requireCrmUser antes de las consultas; no se afirma que se haya demostrado una filtración de datos.
- Alta y edición de Productos ahora verifican requireAdmin antes de mostrar el editor o consultar el producto, alineadas con los permisos existentes de guardado. No se modificaron campos, acciones ni contratos del catálogo.
- Siete pruebas nuevas en src/lib/auth.test.ts cubren sesión ausente, usuario no registrado, perfil inactivo, roles SALES/LOGISTICS, administrador activo y bootstrap del administrador configurado. Se comprueba que metadata de usuario no habilita privilegios. La implementación compartida de auth permanece intacta.
- Validación de esta etapa: 165 pruebas aprobadas en 22 archivos, lint y typecheck correctos. No se repitió build ni pruebas visuales para estas guardas. Sin publicación, migraciones o variables nuevas.

### Dependencias pendientes

npm audit --json reportó 10 paquetes afectados (4 moderados, 5 altos, 1 crítico), incluyendo dependencias transitivas; no son diez ataques demostrados. Vitest 2.1.9 incluye un aviso crítico condicionado al servidor UI expuesto (GHSA-5xrq-8626-4rwp); el script actual ejecuta vitest run. Vite/esbuild arrastran avisos de servidores de desarrollo. Prisma arrastra deepmerge-ts y Next arrastra PostCSS. No se ejecutó audit fix ni se actualizaron versiones en esta etapa.

Pendiente: actualización acotada de herramientas de pruebas y comprobación de compatibilidad. Las actualizaciones de Next/Prisma necesitan revisión separada porque comparten runtime y contratos con APIs del bot; quedan fuera de implementación por la restricción expresa del usuario. El reporte npm no equivale a una evaluación completa de explotabilidad en producción.

No se modificaron prompts, flujos, configuraciones ni comportamiento del bot. La auditoría integral continúa abierta, incluyendo revisión visual desktop/tablet y cierre de dependencias.
