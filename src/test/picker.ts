import { fireEvent, screen } from "@testing-library/react";

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** El botón de la pieza para elegir (262) se llama con su rótulo y lo elegido («Método de ingreso WhatsApp»). */
export const pickerName = (label: string) => new RegExp(`^${escape(label)}( |$)`);

/** Abre la pieza con ese rótulo y elige la opción, sin esperar (como un clic con `fireEvent`). */
export function pick(label: string, option: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name: pickerName(label) }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}
