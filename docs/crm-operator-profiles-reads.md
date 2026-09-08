# Perfiles y lectura individual del CRM

## Ajuste de tarjetas posterior

Lista compacta de dos líneas con avatar del responsable a la izquierda (sin asignación usa ?), nombre/preview y contador a derecha. Se retiran de la lista el punto de disponibilidad y Sin contestar, sin cambiar sus filtros o las reglas de respuesta. Teléfono y contexto siguen dentro del chat. Contador muestra solo el número confirmado en caché; la limitación de historial se explica en tooltip en lugar de +. Solicitudes versionadas evitan que una respuesta vieja sobrescriba lectura reciente; se reintenta el registro visible cada cinco segundos tras fallos. No se afirma contador global de todo WhatsApp ni sincronización con WhatsApp Web. Pendiente QA visual multiusuario; no publicado.

## Continuación: fotos propias

Carga y eliminación de foto propia desde Mi perfil. JPG/PNG/WebP hasta 750 KB, máximo 16 millones de píxeles; normalización con Sharp a WebP de 128×128 sin metadatos. Se almacena separada del perfil para evitar transportar imágenes en todas las consultas de responsables. Endpoint requiere sesión; escritura exige mismo origen y siempre usa el ID autenticado. Lectura privada, sin caché pública. Sidebar y responsables de bandeja muestran foto o iniciales si falta/falla.

Tabla OperatorAvatarPhoto aplicada únicamente en crm con FK y RLS, mediante photo-check/photo-apply del script puntual. No ejecutar migrate deploy hasta conciliar el registro histórico de migraciones. No se cargaron fotos reales de usuarios en QA. Revisión visual autenticada y múltiples operadores todavía pendiente. Sin publicación.

Auditoría npm pendiente: 5 vulnerabilidades (1 moderada, 4 altas) en cadenas Prisma/deepmerge-ts y Next/PostCSS. No se ejecutó audit fix --force: propone cambio mayor de Next. Sharp agregado como dependencia directa.

## Alcance implementado

- Mi perfil: nombre visible (2–60 caracteres), iniciales y cuatro colores. No cambia el correo de acceso, rol ni estado activo. Cada operador edita exclusivamente su propio perfil.
- El nombre existente displayName ya es preferido en responsables y atribuciones del CRM. Avatar agregado al pie del menú, responsable de chat y lista de conversaciones. No se reescriben nombres en eventos históricos.
- Contador individual basado en mensajes entrantes sincronizados, deduplicados por ID. Un signo + indica historial parcial. Sin historial disponible se oculta el contador, no se informa cero.
- Lectura registrada cuando una burbuja entra en el área visible del historial con pestaña visible y enfocada. No se marca por respuesta del bot, precarga o consulta del contador. No sincroniza tildes ni lecturas con WhatsApp Web.
- POST /api/inbox/reads: sesión activa, mismo origen, máximo 200 IDs y verificación contra caché existente. Clave única por operador/conversación/mensaje; la base descarta duplicados concurrentes.

## Base de datos

Se verificó schema=crm. El registro Prisma mostró todas las migraciones históricas pendientes a pesar de tablas existentes; NO se ejecutó migrate deploy ni se recrearon tablas.
Se aplicó únicamente 20260908180000_operator_profiles_and_reads mediante scripts/operator-data.cjs apply, en transacción: avatarColor y OperatorMessageRead con FK y RLS sin políticas públicas. Sin cambios a public/Pricing. La conciliación del historial Prisma queda pendiente antes de cualquier migrate deploy futuro.

## Limitaciones y pendientes

- Avatar fotográfico por carga de archivo pendiente: esta versión ofrece iniciales/color. La foto del cliente desde WhatsApp no está disponible en los datos actuales.
- Contadores corresponden al historial sincronizado disponible, no a un inventario completo de mensajes antiguos. Lectura de páginas anteriores fuera de la caché actual no se persiste todavía.
- Revisión visual y pruebas reales con dos operadores pendientes; no se enviaron mensajes ni se cambiaron clientes durante QA.
- Optimizar consulta de lectura por lotes antes de elevar el tamaño de página: actualmente consulta los contactos visibles y actualizaciones de caché.
- Aplicación no publicada en esta tanda; base aditiva ya aplicada por autorización del usuario.

Pruebas aisladas: 233 aprobadas. Incluyen permisos de edición, validación, origen, aislamiento por operador, IDs inexistentes/salientes, falta de caché y errores seguros. No equivalen a prueba multiusuario en navegador.

No se modificaron prompts, flujos, respuestas, automatizaciones ni configuración de Botpress. El componente de chat solo suma observación visual; sus funciones de envío y control no se alteraron.
