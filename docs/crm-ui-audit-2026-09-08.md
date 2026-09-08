# Auditoría exclusivamente visual

Pedido: adjunto 8dafcf53-d5d9-4a11-87f0-954d520ef965, leído completo.

## Alcance

No editar botpress-agent, acciones del servidor, APIs, integraciones, modelos, migraciones, permisos, automatizaciones ni contenido comercial. Preservar los cambios locales anteriores de asignación: no forman parte de esta tanda estética. No desplegar.

## Plan progresivo

1. Navegación y sistema visual acotado: contraste, iconos, grupos, scroll, foco. Revisar antes de extender tokens a otras pantallas.
2. Botones, formularios, filtros y tablas por módulo, sin alterar parámetros ni acciones.
3. Bandeja y Embudo: densidad, jerarquía, burbujas y controles responsive.
4. Dashboard, Clientes y Tareas.
5. Pedidos y Logística con la referencia visual acordada; Cobertura.
6. Resultados, Productos, Bot y Meta Ads: solo datos existentes.
7. Skeletons, teclado, consola y revisión 1440/1280/1024/768/390.

## Primera implementación parcial

Continuación autorizada para publicación: sidebar contraído a 72 px en escritorio, solo iconos con nombre accesible y tooltip; grupos reabiertos al cambiar el modo visual. Se preserva el drawer móvil existente. Build, lint y typecheck aprobados. Revisión visual autenticada y matriz responsive siguen pendientes; no se consideran validadas por la compilación.

Pruebas: 219 aprobadas; lint, typecheck y build aprobados. Primer intento de build bloqueado por DLL de Prisma en uso; cerrando el servidor local se resolvió. Contrastes calculados de los tokens del menú: texto secundario sobre blanco 5.27:1; marrón sobre beige seleccionado 9.37:1. Esto no sustituye la revisión del CSS computado en pantalla.

Archivos: src/components/crm-frame.tsx, navigation-icon.tsx y crm-navigation.css.

Iconos SVG propios con trazo consistente, grupos plegables nativos, navegación de 228 px en escritorio, activo con barra marrón y beige, controles de 44 px y foco visible. Usuario y cierre de sesión fuera del scroll de grupos. CSS limitado al sidebar; sin redefinir estilos globales de tablas ni formularios. No se agregan contadores.

Revisión visual bloqueada por sesión local cerrada (la ruta Clientes redirige a login). No se validaron aún capturas antes/después, teclado, consola ni resoluciones. Pendientes modo contraído de iconos, fuente local Inter/Geist/Manrope y resto del plan. No afirmar finalización integral.
