# Panel Bot

Ruta autenticada `/bot`. Consulta read-only a `GET /v1/admin/bots/{id}/analytics`.
Credenciales exclusivamente de servidor: BOTPRESS_API_TOKEN (PAT con acceso Admin),
BOTPRESS_BOT_ID y BOTPRESS_WORKSPACE_ID. Para el bot del proyecto, el workspace se
resuelve desde agent.json si no existe la variable; no se aplica a otros bots.

La API y el cliente oficial confirman `llm.cost.sum` en USD: NO dividir entre
1.000.000.000 (esa conversión pertenece al hook de Studio, no a analytics).
La consulta real de septiembre 2026 también devuelve conversationsCreated.
No usar sessions como sustituto. messages está obsoleto: usar userMessages y botMessages.

Caché persistente de Next por bot/workspace/rango durante 300 segundos, revalidada
al consultar; no hay cron ni nuevas tablas. La autenticación ocurre antes de leerla.
Un error no se guarda como resultado exitoso. Datos opcionales ausentes y períodos
vacíos muestran Sin datos, no cero. Los registros existentes se suman sin rellenar
fechas; Botpress puede consolidar con demora. No se guardan transcripciones.

Filtros por días UTC (7, 30 o hasta 90 personalizados); calendario rotulado en UI.
El consumo incluye todos los canales, no solamente WhatsApp. La referencia del CRM
agrupa conversaciones por canal y fecha de creación local, con el mismo rango UTC;
las ventas concretadas incluyen todos los orígenes y filtran deliveredAt.
No atribuir costo por venta ni usuarios únicos a partir de esos totales.

No incluye cargos del plan, impuestos, Meta, saldo, créditos ni límites de gasto.
No modifica la configuración ni el comportamiento del bot.

Validación: tests de rangos, datos faltantes, cero real, USD, autenticación de API
de servidor, errores sanitizados y payloads inválidos. Prueba real del endpoint
realizada sin leer mensajes de clientes ni alterar conversaciones.

Fuente: https://botpress.com/docs/api-reference/admin-api/openapi/getBotAnalytics/
