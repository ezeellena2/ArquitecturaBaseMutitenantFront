/** La acción y todas sus esperas tienen handlers desde el inicio, incluso si una falla primero. */
export async function responsesForAction(page, predicates, action) {
  const results = await Promise.all([
    ...predicates.map((predicate) => Promise.resolve().then(() => page.waitForResponse(predicate))),
    Promise.resolve().then(action),
  ]);
  return results.slice(0, -1);
}

/** F5 sólo observa consultas iniciadas tras el commit del documento principal, no refetches anteriores. */
export async function reloadResponse(page, predicate) {
  const requests = new WeakSet(); let committed = false;
  const navigated = (frame) => { if (frame === page.mainFrame()) committed = true; };
  const requested = (request) => { if (committed) requests.add(request); };
  page.on("framenavigated", navigated); page.on("request", requested);
  try {
    const [response] = await responsesForAction(page,
      [(reply) => requests.has(reply.request()) && predicate(reply)], () => page.reload());
    return response;
  } finally {
    page.off("framenavigated", navigated); page.off("request", requested);
  }
}

/** Clasifica firmas conocidas de Playwright; el mensaje nunca se devuelve ni se publica. */
export function safeActionErrorKind(error) {
  const message = typeof error?.message === "string" ? error.message : "";
  if (["Response body is unavailable", "No resource with given identifier", "No data found for resource with given identifier"].some((signature) => message.includes(signature))) return "bodyUnavailable";
  if (["is interrupted by another navigation", "Navigation interrupted the evaluation"].some((signature) => message.includes(signature))) return "navInterrupted";
  return "unknown";
}
