// La pieza para elegir (262): un botón que se llama con su rótulo y lo elegido («Vale en Toda la organización») y abre un
// listbox con sus `option`, en un portal de la página. Su buscador es el combobox «Buscar en <rótulo>». El asterisco de un
// campo obligatorio puede sumarse al nombre o no, según quién lo calcule.
const escapeLabel = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/** El nombre del botón de la pieza con ese rótulo, sea lo que sea lo elegido. */
export const pickerName = (label) => new RegExp(`^${escapeLabel(label)}(?: \\*)?(?: |$)`, "u");

/** El botón de la pieza con ese rótulo, adentro de `scope` (la página o un diálogo). */
export const pickerButton = (scope, label) => scope.getByRole("button", { name: pickerName(label) });

/** El buscador de la lista abierta de la pieza con ese rótulo. */
export const pickerSearch = (page, label) => page.getByRole("combobox", { name: `Buscar en ${label}`, exact: true });
