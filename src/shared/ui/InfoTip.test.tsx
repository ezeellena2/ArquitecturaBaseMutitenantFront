import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { AppChromeProvider } from "./app/AppChrome";
import { FormField } from "./FormField";
import { Input } from "./input";
import { Section } from "./Section";

const phoneChrome = { phone: true, parent: null, subtitle: null, hideBottomNav: () => {} };

describe("InfoTip · la ayuda en la (i) (116)", () => {
  // «Criterio · Formularios»: en el teléfono, tocar la (i) abre una hoja chica con el texto, con el rótulo de título, sin
  // pasarle el foco al campo.
  it("en el teléfono, tocar la (i) abre una hoja chica con el rótulo y el texto", async () => {
    const user = userEvent.setup();
    const { container } = render(<AppChromeProvider value={phoneChrome}>
      <FormField label="Prefijo de numeración" help="Va adelante del número de cada respuesta."><Input /></FormField>
    </AppChromeProvider>);

    const input = screen.getByRole("textbox", { name: "Prefijo de numeración" });
    expect(input).toHaveAccessibleDescription("Va adelante del número de cada respuesta.");
    await user.click(container.querySelector("[data-slot='info-tip']")!);
    const sheet = await screen.findByRole("dialog", { name: "Prefijo de numeración" });
    expect(sheet).toHaveTextContent("Va adelante del número de cada respuesta.");
    expect(input).not.toHaveFocus();
  });

  // La caja con ayuda la lleva junto a su título, y es la descripción de la región.
  it("una caja lleva la (i) junto a su título y la ayuda describe la región", async () => {
    const { container } = render(<Section title="Dominio de correo" help="Los usuarios con este dominio entran sin invitación.">
      <p>{"delta.ejemplo.com"}</p>
    </Section>);

    const region = screen.getByRole("region", { name: "Dominio de correo" });
    expect(region).toHaveAccessibleDescription("Los usuarios con este dominio entran sin invitación.");
    expect(screen.getByRole("heading", { name: "Dominio de correo" }).parentElement!.querySelector("[data-slot='info-tip']")).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Prueba de arquitectura (116, «Criterio · Formularios», «sin leyendas»): la ayuda de un campo, una casilla, una caja o
// una página va en `help`, que la pone en la (i); nadie escribe una leyenda con `hint` ni con la `description` de esas
// piezas. Las descripciones de una confirmación o de una opción de un desplegable (un dato) siguen.
describe("ayuda y motivos · arquitectura", () => {
  const srcDir = path.resolve(import.meta.dirname, "../..");
  const filesIn = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });

  it("frena una leyenda: ni `hint` ni la `description` de un campo, una casilla, una caja o una página", () => {
    const offenders: string[] = [];
    for (const file of filesIn(srcDir).filter((name) => name.endsWith(".tsx") && !/\.test\.tsx$/.test(name))) {
      const source = readFileSync(file, "utf8");
      const where = path.relative(srcDir, file);
      if (/\bhint=/.test(source)) offenders.push(`${where}: hint=`);
      for (const match of source.matchAll(/<(FormField|CheckboxField|Section|Page)\b[^>]*?\bdescription=/g)) offenders.push(`${where}: <${match[1]} description=`);
    }
    expect(offenders, "La ayuda va en `help` (la (i) con su tooltip); lo que no ayuda a decidir se saca").toEqual([]);
  });
});
