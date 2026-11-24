import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppChromeProvider } from "./app/AppChrome";
import { CheckboxField } from "./CheckboxField";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { FormField } from "./FormField";
import { InfoTip } from "./InfoTip";
import { Input } from "./input";
import { RadioGroupField } from "./RadioGroupField";
import { Section } from "./Section";

const phoneChrome = { phone: true, parent: null, subtitle: null, hideBottomNav: () => {} };
const touch = (target: Element) => userEvent.pointer({ keys: "[TouchA]", target });

describe("InfoTip · la ayuda en la (i) (116 y 211)", () => {
  // 211: en el teléfono, tocar la (i) abre su texto en un tooltip sobre ella, como en la compu, sin pasarle el foco al
  // campo; ya no va en una hoja chica. Tocar afuera lo cierra.
  it("en el teléfono, tocar la (i) abre su texto sobre ella y tocar afuera lo cierra", async () => {
    render(<AppChromeProvider value={phoneChrome}>
      <FormField label="Prefijo de numeración" help="Va adelante del número de cada respuesta."><Input /></FormField>
    </AppChromeProvider>);

    const input = screen.getByRole("textbox", { name: "Prefijo de numeración" });
    expect(input).toHaveAccessibleDescription("Va adelante del número de cada respuesta.");
    await touch(screen.getByRole("button", { name: "Más información sobre Prefijo de numeración" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Va adelante del número de cada respuesta.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(input).not.toHaveFocus();

    await touch(document.body);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  // 211: la (i) se alcanza con Tab y se abre con Enter o Espacio; su texto es su descripción.
  it("se alcanza con Tab y se abre con Enter o Espacio", async () => {
    const { container } = render(<main><InfoTip text="La clave guardada nunca se muestra." title="Clave" /></main>);
    const info = screen.getByRole("button", { name: "Más información sobre Clave" });
    expect(info).toHaveAccessibleDescription("La clave guardada nunca se muestra.");

    await userEvent.tab();
    expect(info).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("La clave guardada nunca se muestra.");
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("tooltip")).toHaveTextContent("La clave guardada nunca se muestra.");
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard(" ");
    expect(await screen.findByRole("tooltip")).toHaveTextContent("La clave guardada nunca se muestra.");
    expect(await axe(container)).toHaveNoViolations();
  });

  // La del estado en la banda (175): su frase es su nombre, y también se abre con un toque o con Enter.
  it("la (i) sola se abre con un toque o con Enter", async () => {
    render(<InfoTip standalone text="El 18/09/2026, 16:45. Motivo: dos meses sin pago." title="Suspendida" />);
    const info = screen.getByRole("img", { name: "El 18/09/2026, 16:45. Motivo: dos meses sin pago." });

    await touch(info);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Motivo: dos meses sin pago.");
    await userEvent.keyboard("{Escape}");
    info.focus();
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Motivo: dos meses sin pago.");
  });

  // La (i) del final de una opción o de una casilla: tocarla abre su ayuda y no elige ni marca.
  it("al final de una opción o de una casilla, tocarla no la elige ni la marca", async () => {
    const onValueChange = vi.fn(), onCheckedChange = vi.fn();
    render(<>
      <RadioGroupField label="Resultado" value={undefined} onValueChange={onValueChange}
        options={[{ value: "sent", label: "Salió", help: "La regla sigue sin volver a mandar este aviso." }, { value: "failed", label: "No salió" }]} />
      <CheckboxField label="Aceptó recibir mensajes" checked={false} onCheckedChange={onCheckedChange} help="Sin esto, WhatsApp no permite escribirle primero." />
    </>);

    await userEvent.click(screen.getByRole("button", { name: "Más información sobre Salió" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("La regla sigue sin volver a mandar este aviso.");
    await touch(screen.getByRole("button", { name: "Más información sobre Aceptó recibir mensajes" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Sin esto, WhatsApp no permite escribirle primero.");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  // Un diálogo pone el foco en lo primero que se alcanza con Tab: si es una (i), su tooltip taparía el contenido. El foco
  // va al campo, y la (i) queda un Tab atrás.
  it("primera en un diálogo, no toma el foco al abrirse", async () => {
    render(<Dialog open>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{"Exportar"}</DialogTitle>
        <FormField label="Archivo" help="Número, recibida y canal siempre se incluyen."><Input /></FormField>
      </DialogContent>
    </Dialog>);

    expect(await screen.findByRole("textbox", { name: "Archivo" })).toHaveFocus();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Más información sobre Archivo" })).toHaveFocus();
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
