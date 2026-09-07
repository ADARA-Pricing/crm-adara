# Gestión desde el embudo

Al hacer clic o Enter/Espacio en una tarjeta, `/embudo?lead=<customerId>` abre un
dialog nativo con foco contenido, cierre con Escape y filtro de categoría preservado.
El selector de etapa y el arrastre no abren la ficha; el clic posterior a un arrastre
se ignora durante 400 ms. Los datos se consultan con sesión verificada.

La ficha reutiliza ConversationChat e InboxPreloader: mismo historial, pausa,
permisos, ventana de WhatsApp e idempotencia de envío de la bandeja. No se envían
mensajes al abrirla. Permite elegir entre las conversaciones del cliente.

Las tareas nuevas son seguimientos vinculados al cliente, asignados a un miembro
activo y con vencimiento opcional en hora Argentina. Se muestran hasta 30 tareas.
Asignar no envía email/WhatsApp ni transfiere automáticamente la conversación.

Eliminar cliente requiere ADMIN, texto ELIMINAR, versión updatedAt vigente,
cero pedidos (de cualquier estado), cero tareas OPEN/IN_PROGRESS y bot pausado
en todas las conversaciones vinculadas a Botpress. La transacción bloquea cliente
y conversaciones y borra eventos locales, conversaciones/caché, tareas finalizadas,
atribuciones y ficha. Las FK hacen rollback ante vínculos nuevos incompatibles.
No se borra en Botpress/Meta y no se bloquea el número; un mensaje nuevo puede
recrear la ficha. No se ejecutaron borrados ni mensajes sobre clientes reales en QA.
