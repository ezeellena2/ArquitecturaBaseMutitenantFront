/// Los ocho motivos de «No se pudo mandar» (ADR 0066 §3): el código que guarda el back y el texto que manda en `failureReason`,
/// en es, como los dibujan WA-Chats-Base2 y Plat-WA-Chats-Base2. El front muestra el texto tal como llega; nunca decide por él.
export const sendFailures = [
  ["WhatsApp.Send.NotAllowed", "Ese número no puede recibir mensajes de esta cuenta."],
  ["WhatsApp.Send.WindowClosed", "Pasaron 24 horas desde su último mensaje."],
  ["WhatsApp.Send.Undeliverable", "WhatsApp no pudo entregarlo a ese número."],
  ["WhatsApp.Send.RateLimited", "WhatsApp frenó el envío por su límite de mensajes. Probá de nuevo en un rato."],
  ["WhatsApp.Send.TokenInvalid", "La conexión con WhatsApp venció. Hay que volver a conectar el número."],
  ["WhatsApp.Send.PermissionMissing", "A la conexión con WhatsApp le falta el permiso para mandar desde este número."],
  ["WhatsApp.Send.Unavailable", "No pudimos comunicarnos con WhatsApp, ni con los reintentos. Probá de nuevo en un rato."],
  ["WhatsApp.Send.Rejected", "WhatsApp rechazó el mensaje."],
] as const;
