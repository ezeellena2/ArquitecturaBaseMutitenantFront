/** Correlaciona la respuesta observada, sin depender del nombre ni del orden de los pedidos. */
export function selectRecovery(items, previous, next) {
  const phoneMatches = (masked, phone) => typeof masked === "string" && masked.replace(/\D/g, "").endsWith(phone.slice(-4));
  const matches = items.filter((item) => item.previousMethodType === "Phone" && item.newMethodType === "Phone"
    && phoneMatches(item.previousMethod, previous) && phoneMatches(item.newMethod, next));
  if (matches.length !== 1) throw new Error("No encontramos un pedido Phone único para este recorrido.");
  return matches[0];
}

/** Usa la tarjeta real del teléfono o la fila del escritorio, sin cambiar el viewport. */
export function recoveryRow(page, item) {
  return page.getByRole(page.viewportSize().width === 390 ? "listitem" : "row")
    .filter({ has: page.getByText(item.previousMethod, { exact: true }) })
    .filter({ has: page.getByText(item.newMethod, { exact: true }) });
}
