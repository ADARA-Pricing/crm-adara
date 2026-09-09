# Etiquetas de envío ADARA

Descarga ZPL individual o por selección en Logística. Formato 800 × 1200 puntos (100 × 150 mm a 203 dpi), Zebra ZD220. Una copia por venta, máximo 50 por descarga. El código de barras contiene únicamente el número de venta interno, no es tracking de Mercado Libre.

Requiere sesión de un usuario CRM activo. Sólo mensajería aprobada, en preparación, enviada o entregada (reimpresión). Pendientes de revisión y retiros se rechazan. El lote se rechaza completo si falta un pedido o hay datos inválidos. No cambia estados, ni registra despacho ni impresión exitosa. No modifica contratos ni configuración del bot.

Por confirmación del negocio, estas ventas se cobran contraentrega. Imprime cantidad, nombre, SKU y precio unitario de cada producto, subtotal de productos, envío y total a cobrar. Usa el precio guardado en OrderItem, no el precio actual del catálogo. Sólo admite CASH_OR_TRANSFER en ARS y verifica que productos más envío coincidan exactamente con el total. No supone pagos parciales ni implementa un registro de cobranzas; si se incorpora venta prepagada hay que distinguirla antes de utilizar esta etiqueta. No cambia reglas de pago del bot.

El detalle admite cuatro renglones; si excede el espacio, rechaza la descarga sin omitir productos (hoja adicional de armado pendiente). Tampoco reproduce datos, identificadores ni códigos privados de la muestra de Mercado Libre. Los textos se codifican byte a byte para evitar inyección ZPL; se rechazan campos que no entran sin truncar la dirección.

Antes del uso operativo: descargar una venta de prueba autorizada, enviar el archivo como ZPL RAW a la Zebra configurada con papel 100 × 150 mm y comprobar márgenes, acentos y escaneo. No abrir como documento para imprimir texto. Impresión física pendiente; la descarga no implica que la impresora lo haya recibido. No se publicó esta implementación todavía.
