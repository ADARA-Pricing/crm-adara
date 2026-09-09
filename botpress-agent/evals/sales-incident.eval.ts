import { Eval } from '@botpress/evals'

// Run against development ONLY, with scripts/fixture-crm.mjs and the matching scenario.
const plain = [{ not_contains: '```' }, { not_contains: '**' }, { not_contains: '`' }]
export const available = new Eval({
  name: 'incident-available', type: 'regression',
  conversation: [
    { user: 'Hola! Quiero más información sobre el celular Infinix del anuncio.', assert: {
      tools: [{ called: 'getProductInfo' }],
      response: [...plain, { contains: 'Smart 10' }, { contains: '199.999' }, { not_contains: 'no me figura disponible' }],
    } },
    { user: '¿Y a qué precio tenés el Infinix 50 Pro?', assert: {
      tools: [{ not_called: 'quoteOrder' }, { not_called: 'recordConfirmedOrder' }],
      response: [...plain, { not_contains: '199.999' }, { llm_judge: 'Dice claramente que el 50 Pro no está disponible. No ofrece derivar, consultar al equipo para conseguirlo, venderlo, avisar reposición ni pedir una captura.' }],
    } },
    { user: 'Ok, gracias', assert: {
      tools: [{ not_called: 'recordConfirmedOrder' }],
      response: [...plain, { llm_judge: 'Cierra brevemente sin pedir dirección, teléfono ni datos de compra, y sin prometer avisos de stock.' }],
    } },
  ],
})
export const photos = new Eval({
  name: 'incident-photos', type: 'regression',
  conversation: [
    { user: '¿Me pasás una foto del Infinix Smart 10?', assert: { response: [...plain, { contains: 'https://example.test/producto-smart-10' }, { not_contains: 'wp-content' }], tools: [{ called: 'getProductInfo' }] } },
    { user: 'No veo la foto', assert: { response: [...plain, { llm_judge: 'Reconoce que no pudo mostrar la foto; no inventa enlaces ni afirma haber adjuntado una imagen, no culpa al teléfono ni pide cambiar Wi-Fi.' }] } },
  ],
})
export const missing = new Eval({
  name: 'incident-missing', type: 'regression',
  conversation: [{ user: '¿Tenés el Infinix del anuncio? Pasame precio y fotos.', assert: {
    tools: [{ called: 'getProductInfo' }, { not_called: 'quoteOrder' }, { not_called: 'recordConfirmedOrder' }],
    response: [...plain, { llm_judge: 'Dice que el producto no está disponible. No inventa precio, alternativas, avisos de reposición ni ofrece derivar para conseguirlo.' }],
  } }],
})
export const handoffFailure = new Eval({
  name: 'incident-handoff-failure', type: 'regression',
  conversation: [{ user: 'Quiero hablar con una persona, por favor derivame.', assert: {
    tools: [{ called: 'requestHumanHandoff' }],
    response: [...plain, { not_contains: '503' }, { llm_judge: 'Reconoce que no pudo registrar la derivación, sin afirmar que ya quedó escalada, que creó una tarea o que alguien responderá como resultado de esa derivación fallida. No promete reintentar más tarde ni seguimiento automático.' }],
  } }],
})
export const disabled = new Eval({
  name: 'incident-disabled', type: 'regression',
  conversation: [{ user: 'Quiero comprar el Infinix del anuncio, pasame el total para retirar.', assert: {
    tools: [{ called: 'getProductInfo' }, { not_called: 'quoteOrder' }, { not_called: 'recordConfirmedOrder' }],
    response: [...plain, { not_contains: '199.999' }, { llm_judge: 'Dice claramente que el producto no está disponible. No ofrece venderlo, cotizarlo, alternativas, avisos de reposición ni derivación para conseguirlo.' }],
  } }],
})
export const paused = new Eval({
  name: 'incident-paused', type: 'regression', options: { idleTimeout: 5000 },
  conversation: [{ user: 'Hola, quiero comprar el Infinix', expectSilence: true }],
})

export const deliveryCapture = new Eval({
  name: 'delivery-capture-without-repetition', type: 'regression',
  conversation: [
    { user: 'Quiero el Infinix con envio y contraentrega. Estoy en CABA.', assert: { response: [{ llm_judge: 'Explica o continúa contraentrega y pide solamente la dirección como siguiente dato, sin pedir barrio ni repetir modalidades.' }] } },
    { user: 'Av. San Juan 3866', assert: { tools: [{ called: 'checkDeliveryCoverage' }], response: [{ llm_judge: 'Interpreta la dirección como envío. No vuelve a preguntar envío versus retiro ni solicita barrio, código postal, piso o timbre de rutina.' }] } },
    { user: 'Para mañana', assert: { response: [{ llm_judge: 'No menciona domingos salvo que mañana sea domingo según la fecha de ejecución.' }] } },
    { user: 'Sebastián Pugliese, 1166837411', assert: { response: [{ llm_judge: 'No muestra tareas, etapas, errores técnicos ni pedidos de barrio; con los datos completos presenta el siguiente paso comercial o el resumen para confirmar.' }] } },
  ],
})
