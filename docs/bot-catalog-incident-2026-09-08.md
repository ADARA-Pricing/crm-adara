# Incidente de catálogo y respuestas (8/9/2026)

Autorización expresa del usuario para diagnosticar/corregir integración, instrucciones y formato del bot. Sin publicación ni mensajes reales durante estas pruebas.

## Evidencia

Consulta de solo lectura: producto id `infinix-smart-10-negro`, SKU `CE002N`, activo y habilitado para bot. El endpoint de ficha y confirmación buscaban el SKU antiguo `INFINIX-SMART-10-NEGRO`; cotización elegía el primer producto activo. Esta diferencia explica la ficha no encontrada y el riesgo de cotizar otro producto.

## Correcciones locales

- Identidad estable compartida para ficha, cotización y confirmación. Sin cambiar SKU, datos, precios, condiciones o cobertura. La integración sigue limitada al Smart 10; un catálogo multiproducto para pedidos requiere trabajo adicional.
- Ficha distingue registro faltante de producto no habilitado mediante `reason` opcional. Un error técnico no significa falta de stock.
- Instrucciones: reconocer menciones explícitas de otros modelos, no sustituirlas por el producto del anuncio, no ofrecer alternativas ni reposición no confirmadas. No afirmar derivación hasta recibir queued y taskId. No insistir con datos de envío antes de resolver producto/fotos/cobertura.
- Normalización del texto saliente para quitar bloques de código, backticks, énfasis y sangría. Precios y URLs preservados. Control de pausa previo a cada envío intacto; limpieza solo posterior a ese control. No se modifican mensajes manuales del CRM.
- Dependencias: CLI local fijada a 2.0.5 y override de @bpinternal/zui a 2.3.1 (compatible con ~2.3.0 del runtime y ^2.3.0 del SDK/Zai/LLMz). Evita mezclar esquemas 2.3.1 y 2.4.1. No se actualizó el runtime del agente ni dependencias del CRM.
- Mensajes de canal wildcard: validación estructural de type/userId/text/tags antes de accederlos. Se mantienen el registro previo del contacto y el control de pausa.
- Ajustes encontrados en simulaciones: cerrar brevemente ante agradecimientos; no volver a ofrecer Smart 10 cuando preguntaron por otro modelo; no prometer reintentos futuros ni exponer códigos HTTP ante un fallo de derivación. Se quitaron espacios antes de signos de puntuación.

## Validación

188 pruebas aprobadas, incluyendo regresión del SKU editable, estados de catálogo, autenticación, formato, lectura segura de mensajes y pausa verificada antes de cada envío. Lint y TypeScript del CRM correctos; build de producción del CRM aprobado en la primera parte del incidente. TypeScript del agente, `adk check` sin errores/advertencias y `adk build` final aprobados. Los errores TS2589/TS2322 entre copias de Zui y TS2339 del canal wildcard quedaron resueltos sin desactivar validaciones de tipos.

Siete evaluaciones conversacionales aprobadas (10 turnos), contra bot de desarrollo separado y CRM ficticio en memoria:

- `incident-available`: identifica Smart 10 con precio de ficha; diferencia 50 Pro sin cotizarlo; agradecimiento breve. Primera corrida falló el cierre; se corrigió y repitió con éxito.
- `incident-photos`: usa la URL exacta de la ficha, sin inventar imágenes ni culpar al dispositivo cuando no se ven.
- `incident-missing`: no interpreta ficha ausente como stock agotado.
- `incident-handoff-failure`: reconoce derivación no registrada, sin códigos técnicos ni promesas de reintento. Se endureció la evaluación tras detectar una promesa de reintento en la primera respuesta.
- `incident-disabled`: no cotiza ni registra un producto desactivado.
- `incident-paused`: sin respuesta cuando el CRM indica pausa.
- `incident-greeting`: saludo natural sin lanzar una oferta ni registrar un pedido.

Las evaluaciones son muestras del comportamiento, no una garantía absoluta sobre todas las respuestas futuras. No se alteraron clientes, pedidos, stock ni conversaciones reales. Se habilitó Chat 1.0.0 únicamente en desarrollo para estas pruebas; no se promovió a producción. La URL temporal del CRM ficticio se retiró y se verificó la restauración del valor previo ausente. Servidores locales de pruebas detenidos; puertos 3102/3103/3104 sin escucha al finalizar.

## Repetición segura

Usar `scripts/fixture-crm.mjs` y `scripts/run-incident-eval.mjs` dentro de `botpress-agent`. El ejecutor exige un bot dev distinto de producción y verifica `crmApiBaseUrl=http://127.0.0.1:3102` antes de seleccionar el escenario y ejecutar. Requiere agente dev en 3103 y consola en 3104. En Windows puede indicarse la ruta de Bun mediante `ADARA_BUN_EXECUTABLE`. No ejecutar estas evaluaciones directamente contra producción ni contra el CRM real. Las cotizaciones/pedidos están deliberadamente bloqueados en el servidor ficticio.

La CLI requiere Bun (probado con 1.4.1 ya instalado). El paquete npm de la consola intenta abrir recursos con rutas relativas: para este entorno se inició `ui-server-entry.js --port 3104 --standalone` desde su directorio `node_modules/@botpress/adk-cli/dist`, sin editar dependencias. Advertencia de Agent(0) al arrancar en Windows: no impidió las evaluaciones del agente comercial.

## Pendiente de publicación

El usuario autorizó publicar el CRM y el agente, reforzando la regla de no ofrecer artículos no activos. Publicación en curso: primero CRM y luego agente, conservando configuración e integraciones de producción. La integración comercial sigue limitada al Smart 10; vender múltiples productos es trabajo adicional.

El primer intento de publicación fue detenido por el control de seguridad. El usuario confirmó expresamente enviar los 24 archivos preparados a `https://github.com/ADARA-Pricing/crm-adara`, rama `main`, y actualizar CRM y agente en producción. Se verificó que el repositorio es privado y pertenece a la sesión del usuario, y que Vercel lo muestra conectado a `crm-adara.vercel.app`. Entorno de pruebas detenido y URL temporal de desarrollo retirada con verificación. Publicación retomada con esta confirmación.

Refuerzo autorizado: producto fuera del catálogo, desactivado o ausente responde que no está disponible, sin ofrecer derivar para conseguirlo ni avisos de reposición. Una falla técnica real sigue tratándose como imposibilidad de verificar, no como stock agotado. Se repitieron y aprobaron las simulaciones de otro modelo, producto desactivado y ficha ausente con estos criterios más estrictos.

La ficha ahora devuelve `product.id`; las herramientas de cotización y confirmación requieren ese ID. El CRM rechaza un ID distinto del producto soportado y vuelve a consultar `isActive=true` e `isAvailableForBot=true` en ambos pasos. El campo del endpoint es opcional para permitir publicar CRM antes del agente y preservar consumidores anteriores; si se omite solo puede usar el producto fijo soportado, nunca un primer producto arbitrario. 192 pruebas aprobadas, lint/typecheck y build final del CRM correctos. Plan de despliegue ADK sin cambios de configuración, sin dependencias bloqueadas ni operaciones destructivas.

Npm informa 23 alertas en el árbol del agente incluyendo CLI de desarrollo (1 baja, 14 moderadas, 8 altas); antes de agregar la CLI eran 14. Quedan pendientes de análisis separado, sin aplicar actualizaciones automáticas o cambios incompatibles durante este incidente.
