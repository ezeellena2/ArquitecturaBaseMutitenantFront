/** La acción y todas sus esperas tienen handlers desde el inicio, incluso si una falla primero. */
export async function responsesForAction(page, predicates, action) {
  const results = await Promise.all([
    ...predicates.map((predicate) => Promise.resolve().then(() => page.waitForResponse(predicate))),
    Promise.resolve().then(action),
  ]);
  return results.slice(0, -1);
}
