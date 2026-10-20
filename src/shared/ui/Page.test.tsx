import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppChromeProvider } from "./app/AppChrome";
import { Page, SublineSeparator } from "./Page";
import { CloseIcon, RotateIcon, UsersIcon } from "./icons";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";

describe("Page", () => {
  it("names the screen with a single level-one heading", () => {
    renderWithProviders(
      <Page icon={UsersIcon} title="Usuarios">
        <p>{"contenido"}</p>
      </Page>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toBeInTheDocument();
    // Uno por ruta: si una pantalla agrega otro, el lector pierde el punto de referencia.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("uses the static 64 px band and shared page padding", () => {
    const { container } = renderWithProviders(
      <Page icon={UsersIcon} title="Usuarios">
        <p>{"contenido"}</p>
      </Page>,
    );

    const band = screen.getByRole("heading", { level: 1 }).closest("header");
    const body = container.querySelector('[class~="p-4"]');
    // «Criterio · Marco» (.bnd): 64 de alto con 10 arriba y abajo; con la segunda línea, 65 (los tableros de edición, 64).
    expect(band).toHaveClass("min-h-16", "py-2.5");
    expect(band).not.toHaveClass("py-3");
    expect(band).not.toHaveClass("sticky");
    expect(body).toHaveClass("p-4", "lg:px-6", "lg:py-5", "text-[13px]", "flex", "flex-col", "gap-3.5");
  });

  it("hides the section icon from the screen reader", () => {
    const { container } = renderWithProviders(
      <Page icon={UsersIcon} title="Usuarios">
        <p>{"contenido"}</p>
      </Page>,
    );

    // Es identidad visual, no información: el título ya dice dónde estás.
    expect(container.querySelector("svg")?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("renders the primary action", () => {
    renderWithProviders(
      <Page icon={UsersIcon} title="Usuarios" actions={<button type="button">{"Nuevo usuario"}</button>}>
        <p>{"contenido"}</p>
      </Page>,
    );

    expect(screen.getByRole("button", { name: "Nuevo usuario" })).toBeInTheDocument();
  });

  it("shows a compact summary below the title and keeps the primary action at the right", () => {
    renderWithProviders(
      <Page icon={UsersIcon} title="Usuarios" summary="11 usuarios · 7 activos · 3 invitaciones" actions={<button type="button">{"Invitar usuario"}</button>}>
        <p>{"contenido"}</p>
      </Page>,
    );

    const heading = screen.getByRole("heading", { level: 1, name: "Usuarios" });
    const summary = screen.getByText("11 usuarios · 7 activos · 3 invitaciones");
    const band = heading.closest("header");
    expect(summary).toHaveClass("truncate");
    expect(heading.parentElement?.parentElement).toContainElement(summary);
    expect(band).toContainElement(screen.getByRole("button", { name: "Invitar usuario" }));
  });

  it("on the phone moves the actions to a second line instead of cutting the title", () => {
    renderWithProviders(
      <Page icon={UsersIcon} title="Configuración" actions={<><button type="button">{"Descartar cambios"}</button><button type="button">{"Guardar cambios"}</button></>}>
        <p>{"contenido"}</p>
      </Page>,
    );

    // A 390 px el título quedaba en «C..». El título se reserva 12rem y los botones bajan si no entran;
    // en la compu sigue todo en una fila. El definitivo (barra de app) es el paquete 4 de la alineación.
    const band = screen.getByRole("heading", { level: 1 }).closest("header");
    const titleBlock = band?.firstElementChild;
    expect(band).toHaveClass("flex-wrap", "md:flex-nowrap");
    expect(titleBlock).toHaveClass("flex-[1_1_12rem]", "md:flex-1");
  });

  it("puts extra actions in a named menu before the primary action", async () => {
    const remove = vi.fn();
    renderWithProviders(
      <Page
        title="Usuarios"
        actions={<button type="button">{"Invitar usuario"}</button>}
        moreActions={{
          label: "Más acciones",
          items: [
            { label: "Eliminar", onSelect: remove, destructive: true },
            { label: "Exportar", onSelect: vi.fn() },
          ],
        }}
      >
        <p>{"contenido"}</p>
      </Page>,
    );

    const trigger = screen.getByRole("button", { name: "Más acciones" });
    expect(trigger).toHaveClass("size-[34px]");
    expect(trigger.compareDocumentPosition(screen.getByRole("button", { name: "Invitar usuario" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Exportar", "Eliminar"]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    expect(remove).toHaveBeenCalledOnce();
  });

  it("puts the content inside its own padded area, outside the band", () => {
    renderWithProviders(
      <Page icon={UsersIcon} title="Usuarios">
        <p>{"contenido"}</p>
      </Page>,
    );

    // La banda llega a los bordes y el contenido no: por eso el padding lo pone este componente y no cada
    // pantalla. Un padding que hay que acordarse de poner es un criterio que se pierde.
    const contenido = screen.getByText("contenido");
    const banda = screen.getByRole("heading", { level: 1 }).closest("header");

    expect(banda).not.toBeNull();
    expect(banda?.contains(contenido)).toBe(false);
  });

  // Una pantalla hija (el rol en /roles/{id}) cambia el ícono por un enlace de volver. Un `Link` necesita un
  // router alrededor; alcanza con uno de memoria, como en UserMenu.test.tsx.
  describe("in a child screen", () => {
    it("draws a link back to its parent instead of the section icon", () => {
      const { container } = renderWithProviders(
        <MemoryRouter>
          <Page
            icon={UsersIcon}
            title="Editar el rol Soporte"
            backTo={{ to: "/roles", label: "Volver a Roles y permisos" }}
          >
            <p>{"contenido"}</p>
          </Page>
        </MemoryRouter>,
      );

      const volver = screen.getByRole("link", { name: "Volver a Roles y permisos" });
      const banda = screen.getByRole("heading", { level: 1 }).closest("header");

      expect(volver).toHaveClass("size-7");
      expect(volver).toHaveAttribute("href", "/roles");
      expect(banda).toContainElement(volver);
      // En lugar del ícono, no además: dos marcas al lado del título compiten por el mismo lugar.
      expect(container.querySelectorAll("header svg")).toHaveLength(1);
      expect(volver.querySelector("svg")).not.toBeNull();
    });

    it("puts the status in the second line without renaming the heading", () => {
      renderWithProviders(
        <MemoryRouter>
          <Page
            title="Editar el rol Soporte"
            backTo={{ to: "/roles", label: "Volver a Roles y permisos" }}
            status={<span>{"Cambios sin guardar"}</span>}
          >
            <p>{"contenido"}</p>
          </Page>
        </MemoryRouter>,
      );

      const titulo = screen.getByRole("heading", { level: 1, name: "Editar el rol Soporte" });
      const estado = screen.getByText("Cambios sin guardar");

      // Debajo del h1, no al lado: Criterio-Marco reserva la segunda línea para el estado.
      const segundaLinea = estado.closest("[data-slot='page-subline']");
      expect(titulo).not.toContainElement(estado);
      expect(titulo.nextElementSibling).toBe(segundaLinea);
      expect(segundaLinea).toContainElement(estado);
    });
  });

  // Tableros Usuario y Rol: el estado va primero en la segunda línea, antes del resumen.
  it("pone el estado antes del resumen en la segunda línea", () => {
    renderWithProviders(
      <MemoryRouter>
        <Page title="Dueño" summary="Vale en toda la organización · 1 usuario lo tiene" status="De sistema"><p>{"contenido"}</p></Page>
      </MemoryRouter>,
    );

    const subline = screen.getByText("De sistema").closest("[data-slot='page-subline']");
    expect(subline?.textContent).toBe("De sistema·Vale en toda la organización · 1 usuario lo tiene");
    // «Criterio · Marco» (.bnd .res): la segunda línea va a 2 del título, y la banda mide 65.
    expect(subline).toHaveClass("mt-0.5");
    // El «·» entre el estado y el resumen, en el gris tenue y a 6 de cada lado (.bnd .res > * + *::before).
    expect(subline?.querySelector("[data-slot=subline-separator]")).toHaveClass("mx-1.5", "text-[var(--t3)]");
  });

  // Tablero «Criterio · Avisos»: el cartel va arriba del contenido, debajo de la banda, a todo el ancho.
  it("deja el cartel debajo de la banda y antes del contenido", () => {
    renderWithProviders(
      <MemoryRouter>
        <Page title="Configuración" banner={<div role="alert">{"Alguien cambió estos datos."}</div>}><p>{"contenido"}</p></Page>
      </MemoryRouter>,
    );

    const banner = screen.getByRole("alert");
    const header = screen.getByRole("banner");
    expect(header.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(header).not.toContainElement(banner);
    expect(banner.nextElementSibling).toBe(screen.getByText("contenido"));
  });

  it("keeps the section icon and has no way back when the screen is not a child", () => {
    const { container } = renderWithProviders(
      <MemoryRouter>
        <Page icon={UsersIcon} title="Usuarios">
          <p>{"contenido"}</p>
        </Page>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("header [aria-hidden='true'] svg")).not.toBeNull();
  });

  // «Criterio · Marco», Pestañas (decisión del usuario del 2026-10-05, 6d-4a): una pestaña por grupo de datos cuando hay
  // dos o más; con uno solo, su contenido va sin la barra de pestañas, en la compu y en el teléfono. Vale para toda ficha.
  describe("con pestañas", () => {
    const groups = (withRoles: boolean) => ({
      label: "Partes de la empresa", value: "members", onValueChange: vi.fn(),
      items: [
        { value: "members", label: "Miembros", count: 6, content: <p>{"los miembros"}</p>, className: "flex flex-col gap-3" },
        { value: "roles", label: "Roles", count: 2, content: <p>{"los roles"}</p>, hidden: !withRoles },
      ],
    });
    const renderPage = (tabs: ReturnType<typeof groups>, phone: boolean) => renderWithProviders(
      <AppChromeProvider value={{ phone, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <MemoryRouter><Page icon={UsersIcon} title="Delta S.A." tabs={tabs} /></MemoryRouter>
      </AppChromeProvider>,
    );

    // R21: la cantidad de la pestaña pasa por el formato de la cultura, en la compu y en el teléfono.
    it.each([["es-AR", false, "1.000"], ["en-US", true, "1,000"]])("con %s (teléfono: %s), la cantidad lleva separador de miles", async (culture, phone, shown) => {
      await configureI18n(referenceDataFixture().cultures);
      await changeCulture(culture);
      const tabs = groups(true);
      renderPage({ ...tabs, items: [{ ...tabs.items[0], count: 1_000 }, tabs.items[1]] }, phone);
      expect(await screen.findByRole("tab", { name: `Miembros ${shown}` })).toBeVisible();
    });

    // Tableros M-* (.ap-bar .sub): en el teléfono, debajo del título, el «·» va como texto, « · », y no con los 6 de la compu.
    it("en el teléfono, el separador de la línea de abajo del título es « · »", () => {
      renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <MemoryRouter><Page title="Página pública" phoneSubtitle={<>{"Publicada"}<SublineSeparator />{"Cambios sin guardar"}</>}><p>{"datos"}</p></Page></MemoryRouter>
      </AppChromeProvider>);

      expect(screen.getByRole("heading", { level: 1, name: "Página pública" }).closest("header")).toHaveTextContent("Publicada · Cambios sin guardar");
      expect(document.querySelector("[data-slot=subline-separator]")).toBeNull();
    });

    // Tableros M-Usuarios y M-Usuario (.ap-bar .ap-ib): el ⋮ de la barra mide 20.
    it("en el teléfono, el ⋮ de la barra mide 20", () => {
      renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <MemoryRouter><Page title="Usuarios" moreActions={{ label: "Más acciones", items: [{ label: "Cargar teléfonos", onSelect: () => {} }] }}><p>{"lista"}</p></Page></MemoryRouter>
      </AppChromeProvider>);

      expect(screen.getByRole("button", { name: "Más acciones" }).querySelector("svg")).toHaveClass("size-5");
    });

    // «Criterio · Menús» (v136; M-Usuario, M-Usuarios, M-WA-Contacto): el ⋮ de la barra de una ficha o de una lista abre
    // la hoja de abajo con su nombre de título, sin íconos; lo de peligro va al final, en rojo, después de una franja.
    it("en el teléfono, el ⋮ de la barra abre la hoja con el nombre de la ficha y lo de peligro al final", async () => {
      const user = userEvent.setup();
      const resend = vi.fn();
      const { container } = renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <MemoryRouter><Page title="Martina López" moreActions={{ label: "Acciones de Martina López", items: [
          { label: "Revocar invitación", icon: CloseIcon, destructive: true, onSelect: () => {} },
          { label: "Reenviar invitación", icon: RotateIcon, onSelect: resend },
          { label: "Cambiar roles", hidden: true, onSelect: () => {} },
        ] }}><p>{"datos"}</p></Page></MemoryRouter>
      </AppChromeProvider>);

      const trigger = screen.getByRole("button", { name: "Acciones de Martina López" });
      expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      await user.click(trigger);
      const sheet = await screen.findByRole("dialog", { name: "Martina López" });
      const menu = within(sheet).getByRole("menu", { name: "Acciones de Martina López" });
      expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Reenviar invitación", "Revocar invitación"]);
      expect(within(menu).getByRole("separator")).toBeInTheDocument();
      expect(within(menu).getByRole("menuitem", { name: "Revocar invitación" })).toHaveClass("text-[var(--peligro)]");
      expect(menu.querySelector("svg")).toBeNull();
      expect(await axe(container.ownerDocument.body)).toHaveNoViolations();

      await user.click(within(menu).getByRole("menuitem", { name: "Reenviar invitación" }));
      expect(resend).toHaveBeenCalledWith(trigger);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    // «Criterio · Menús» (v136): en la compu, cada opción del ⋮ de la banda lleva su ícono gris de 16.
    it("en la compu, cada opción del ⋮ de la banda lleva su ícono", async () => {
      const user = userEvent.setup();
      renderWithProviders(<MemoryRouter><Page title="Martina López" moreActions={{ label: "Acciones de Martina López", items: [
        { label: "Reenviar invitación", icon: RotateIcon, onSelect: () => {} },
      ] }}><p>{"datos"}</p></Page></MemoryRouter>);

      screen.getByRole("button", { name: "Acciones de Martina López" }).focus();
      await user.keyboard("{Enter}");
      expect((await screen.findByRole("menuitem", { name: "Reenviar invitación" })).querySelector("svg")).toHaveClass("size-4");
    });

    // M-Configuracion y M-Rol (.ap-cuerpo): el cuerpo con margen va con 4 arriba, 20 a los costados y 14 entre bloques.
    it("en el teléfono, el cuerpo con margen va como el del tablero", () => {
      renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <MemoryRouter><Page title="Configuración"><p>{"los datos"}</p></Page></MemoryRouter>
      </AppChromeProvider>);

      expect(screen.getByText("los datos").parentElement).toHaveClass("gap-3.5", "px-5", "pt-1");
    });

    // Tableros M-* («Criterio · Marco»): la barra de arriba queda fija aunque la pantalla sea más alta que el teléfono, y
    // debajo de la barra de estado. Es `sticky` y no sale de su caja: si la caja se encoge al alto del marco (un hijo flex
    // con `min-h-full`), la barra se va con el scroll después de la primera pantalla (Usuarios, Chats, Organización).
    it("en el teléfono, la barra queda fija arriba en una pantalla larga", () => {
      renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <MemoryRouter><Page title="Usuarios" phoneBody="flush"><p>{"la lista"}</p></Page></MemoryRouter>
      </AppChromeProvider>);

      const bar = screen.getByRole("heading", { level: 1, name: "Usuarios" }).closest("header");
      expect(bar).toHaveClass("sticky", "top-0", "box-content", "pt-[env(safe-area-inset-top)]");
      expect(bar?.parentElement).toHaveClass("min-h-full", "shrink-0");
    });

    // Tableros M-Asistente-* (.ap-cuerpo, .as-tcuerpo y .as-tpie): en un chat, la caja mide justo el alto del marco y el
    // cuerpo no deja que lo que lleva la estire. Así el hilo se desplaza adentro y la caja de escribir queda abajo, sobre
    // la barra de abajo. Si la caja creciera con el hilo, se desplazaría el `main` y la caja de escribir saldría de la vista.
    it("en el teléfono, un chat mide el alto del marco y lo que lleva se desplaza adentro", () => {
      renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <MemoryRouter><Page title="Asistente" phoneBody="chat"><p>{"el hilo"}</p></Page></MemoryRouter>
      </AppChromeProvider>);

      const page = screen.getByRole("heading", { level: 1, name: "Asistente" }).closest("header")?.parentElement;
      expect(page).toHaveClass("flex", "min-h-0", "flex-1", "flex-col");
      expect(page).not.toHaveClass("min-h-full");
      expect(page).not.toHaveClass("shrink-0");
      expect(screen.getByText("el hilo").parentElement).toHaveClass("flex", "min-h-0", "flex-1", "flex-col", "overflow-hidden");
    });

    // M-Avisos (.ap-cuerpo, «Alguien cambió esto»): debajo del cartel, el cuerpo arranca a 14.
    it("en el teléfono, con un cartel arriba, el cuerpo con margen arranca a 14", () => {
      renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <MemoryRouter><Page title="Configuración" banner={<div role="status">{"Otra persona cambió esto"}</div>}><p>{"los datos"}</p></Page></MemoryRouter>
      </AppChromeProvider>);

      // El 14 lo decide el cartel que se ve: el cuerpo lleva la regla «después de un cartel que no está vacío».
      const body = screen.getByText("los datos").parentElement!;
      expect(body).toHaveClass("pt-1", "[[data-slot=page-banner]:not(:empty)+&]:pt-3.5");
      expect(body.previousElementSibling).toHaveAttribute("data-slot", "page-banner");
      expect(body.previousElementSibling).not.toBeEmptyDOMElement();
    });

    // useEditPage da siempre un fragmento como cartel (vacío si no hay nada que avisar): vacío, el cuerpo arranca a 4.
    it("en el teléfono, un cartel vacío no corre el cuerpo", () => {
      renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <MemoryRouter><Page title="Configuración" banner={<>{null}</>}><p>{"los datos"}</p></Page></MemoryRouter>
      </AppChromeProvider>);

      const body = screen.getByText("los datos").parentElement!;
      expect(body.previousElementSibling).toHaveAttribute("data-slot", "page-banner");
      expect(body.previousElementSibling).toBeEmptyDOMElement();
      expect(body).toHaveClass("pt-1");
      expect(body).not.toHaveClass("pt-3.5");
    });

    it.each([["la compu", false], ["el teléfono", true]] as const)("con un solo grupo va sin la barra de pestañas, en %s", (_, phone) => {
      const { container } = renderPage(groups(false), phone);

      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
      expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
      expect(container.querySelector("[data-slot='page-tabs']")).toBeNull();
      expect(screen.getByText("los miembros").parentElement).toHaveClass("flex", "flex-col", "gap-3");
      expect(screen.queryByText("los roles")).not.toBeInTheDocument();
    });

    it.each([["la compu", false], ["el teléfono", true]] as const)("con dos grupos, la barra abre el contenido y cambia de grupo, en %s", async (_, phone) => {
      const user = userEvent.setup();
      const tabs = groups(true);
      renderPage(tabs, phone);

      const list = screen.getByRole("tablist", { name: "Partes de la empresa" });
      await waitFor(() => expect(within(list).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Miembros 6", "Roles 2"]));
      expect(screen.getByRole("tabpanel")).toHaveTextContent("los miembros");
      await user.click(screen.getByRole("tab", { name: /Roles/ }));
      expect(tabs.onValueChange).toHaveBeenCalledWith("roles");
    });
  });
});
