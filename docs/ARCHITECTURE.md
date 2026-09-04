# Arquitectura inicial

El sistema se divide en dos responsabilidades:

1. **Botpress Cloud** atiende WhatsApp, interpreta mensajes y solicita acciones del negocio.
2. **Adara Sales CRM** es la fuente de verdad de clientes, catálogo, pedidos, estados y trazabilidad.

## Flujo de integración

```text
Cliente por WhatsApp
  -> Botpress
  -> webhook/API autenticada del CRM
  -> PostgreSQL
  -> respuesta estructurada a Botpress
  -> Cliente
```

Botpress no almacenará los pedidos como fuente de verdad. Solo conservará el contexto conversacional necesario; cada acción comercial relevante se registrará en el CRM.

## Alcance de la primera versión

- Clientes identificados por WhatsApp.
- Catálogo y stock básico.
- Creación y seguimiento de pedidos.
- Conversaciones, mensajes y derivación a una persona.
- Webhook autenticado desde Botpress.

## Publicación

- El CRM se versionará en Git y se desplegará separadamente.
- El bot se creará de cero en Botpress, se probará en el emulador y se publicará solo después de validar el flujo.
- Antes de cualquier modificación al bot anterior, se mantendrá como referencia sin cambios.
