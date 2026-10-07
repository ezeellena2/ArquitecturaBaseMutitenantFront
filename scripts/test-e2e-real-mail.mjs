export function plainTextBody(eml) {
  const start = eml.search(/^Content-Type: text\/plain\b/im);
  if (start < 0) return null;
  const headersEnd = eml.indexOf("\r\n\r\n", start);
  if (headersEnd < 0) return null;
  const body = eml.slice(headersEnd + 4);
  const boundary = body.search(/\r?\n--/);
  return boundary < 0 ? body : body.slice(0, boundary);
}

export function pickupCode(eml) {
  // RenderCode pone el OTP en su propio párrafo; invitaciones y avisos pueden contener números en nombres o enlaces.
  return plainTextBody(eml)?.match(/^(\d{6})\r?$/m)?.[1] ?? null;
}
