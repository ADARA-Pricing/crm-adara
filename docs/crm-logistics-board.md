# Logística: panel operativo inspirado en Mercado Libre

Implementación local: pestañas Pendientes, Envíos de hoy, Próximos días, En tránsito y Finalizadas. Son filtros de lectura sobre estados existentes, no nuevos estados. Hoy/próximos usan fecha programada con límites de día argentino. Pendientes incluye sin fecha y atrasados. Finalizadas muestra DELIVERED, no canceladas. Retiro en Cramer y mensajería privada conservados.

Contadores calculados con los filtros de búsqueda/modalidad/estado/agenda/fecha actuales; pueden dar cero si se combinan criterios incompatibles. Pendientes se superpone con Hoy/Próximos: no sumar pestañas. Sin consultas a servicios de Mercado Libre.

Tarjetas con número y fecha de venta, destinatario, total, productos/unidades/SKU y datos operativos. Formulario existente plegado. Acciones y permisos intactos. Selección individual/múltiple es local a la vista, no modifica pedidos. Sin impresión ni operaciones masivas habilitadas. ZPL requiere formato/tamaño/DPI antes de implementación.

Pruebas: 245 aprobadas antes de último ajuste de presentación; lint/typecheck aprobados. QA visual autenticada y responsive pendiente. Sin cambios a base, bot, APIs de pedidos o transiciones. No publicado.
