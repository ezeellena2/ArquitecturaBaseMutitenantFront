import { fireEvent, screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** El botón de la pieza para elegir (262) se llama con su rótulo y lo elegido («Método de ingreso WhatsApp»). */
export const pickerName = (label: string) => new RegExp(`^${escape(label)}( |$)`);

/** Abre la pieza con ese rótulo y elige la opción, sin esperar (como un clic con `fireEvent`). */
export function pick(label: string, option: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name: pickerName(label) }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

/** Abre la pieza con ese rótulo y elige la opción, como una persona. */
export async function choose(user: UserEvent, label: string, option: string | RegExp) {
  await user.click(await screen.findByRole("button", { name: pickerName(label) }));
  await user.click(await screen.findByRole("option", { name: option }));
}
