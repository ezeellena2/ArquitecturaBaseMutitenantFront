import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Link, RouterProvider, createMemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { configureI18n } from "@/shared/i18n";
import { AppChromeProvider } from "@/shared/ui/app/AppChrome";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { useEditPage } from "./useEditPage";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

const conflict = new ApiError(409, { code: "General.ConcurrencyConflict", detail: "Otra persona cambió esto. Revisá la versión más reciente antes de guardar." });
const lastOwner = new ApiError(409, { code: "Tenancy.Member.LastTenantAdmin", detail: "Tiene que quedar al menos un Dueño activo." });

/// Una ficha mínima que arma la banda, el cartel, la franja y la pregunta de salida con el hook, como Configuración.
function Editor({ error, onSeeNew = () => {}, onContinueEditing = () => {}, searchKeys }: { error?: unknown; onSeeNew?: () => void; onContinueEditing?: () => void; searchKeys?: readonly string[] }) {
  const [dirty, setDirty] = useState(false);
  const edit = useEditPage({ isDirty: dirty, error, onSeeNew, onContinueEditing, searchKeys });

  return <>
    <h1>{"Configuración"}</h1>
    <p data-testid="banda">{edit.unsaved}</p>
    {edit.banner}
    {edit.formError}
    <button type="button" onClick={() => setDirty(true)}>{"Cambiar algo"}</button>
    <Link to="/empresas">{"Empresas"}</Link>
    <Link to="?tab=catalog">{"Catálogo"}</Link>
    {edit.leaveDialog}
  </>;
}

function renderEditor(props: Parameters<typeof Editor>[0] = {}) {
  const router = createMemoryRouter([
    { path: "/configuracion", element: <Editor {...props} /> },
    { path: "/empresas", element: <h1>{"Empresas"}</h1> },
  ], { initialEntries: ["/configuracion"] });
  renderWithProviders(<RouterProvider router={router} />);
  return router;
}

describe("useEditPage", () => {
  it("puede proteger un cambio de grupo en URL sin bloquear filtros ajenos", async () => {
    const router = renderEditor({ searchKeys: ["tab"] });
    await userEvent.click(await screen.findByRole("button", { name: "Cambiar algo" }));
    await userEvent.click(screen.getByRole("link", { name: "Catálogo" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Salir sin guardar?" });
    expect(router.state.location.search).toBe("");
    await userEvent.click(within(dialog).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(router.state.location.search).toBe("?tab=catalog"));
  });
  it("sin cambios ni error, no muestra nada y deja salir", async () => {
    const router = renderEditor();

    expect(await screen.findByTestId("banda")).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Empresas" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/empresas"));
  });

  it("con cambios, «Cambios sin guardar» en la banda y «¿Salir sin guardar?» antes de salir", async () => {
    const router = renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: "Cambiar algo" }));

    expect(screen.getByTestId("banda")).toHaveTextContent("Cambios sin guardar");
    await userEvent.click(screen.getByRole("link", { name: "Empresas" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Salir sin guardar?" });
    expect(dialog).toHaveTextContent("Se pierde lo que cambiaste acá.");
    expect(router.state.location.pathname).toBe("/configuracion");

    await userEvent.click(within(dialog).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/empresas"));
  });

  it("el 409 de concurrencia va solo en el cartel, con «Ver lo nuevo» y «Seguir editando»", async () => {
    const onSeeNew = vi.fn();
    const onContinueEditing = vi.fn();
    renderEditor({ error: conflict, onSeeNew, onContinueEditing });

    const alerts = await screen.findAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent("Otra persona cambió esto mientras lo editabas.");
    expect(screen.queryByText(/Revisá la versión más reciente/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(onContinueEditing).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Ver lo nuevo" }));
    expect(onSeeNew).toHaveBeenCalledOnce();
  });

  it("otro error del back va solo en la franja, con su texto", async () => {
    renderEditor({ error: lastOwner });

    const alerts = await screen.findAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent("Tiene que quedar al menos un Dueño activo.");
    // Tablero Usuario (.w-cartel.o-prob): en la compu, la franja debajo de la banda es el cartel de problema de «Criterio ·
    // Avisos», de 44 con el ícono de 18, y no la franja de un diálogo.
    expect(alerts[0]).toHaveClass("min-h-11", "rounded-[10px]", "bg-[var(--peligro-t)]");
    expect(alerts[0].querySelector("svg")).toHaveClass("size-[18px]");
    expect(screen.queryByRole("button", { name: "Ver lo nuevo" })).not.toBeInTheDocument();
  });

  // Tableros M-Usuario y M-Pagina-Org (v106, «Error al guardar»): en el teléfono el error de guardado, con el texto del
  // back, va en una banda a todo el ancho debajo de la barra (el lugar de los carteles), no en una caja dentro del cuerpo.
  it("en el teléfono, el error de guardado va en la banda debajo de la barra, con el texto del back", async () => {
    function PhoneEditor() {
      const edit = useEditPage({ isDirty: true, error: lastOwner, onSeeNew: () => {}, onContinueEditing: () => {} });
      return <>
        <div data-testid="cartel">{edit.banner}</div>
        <div data-testid="franja">{edit.formError}</div>
      </>;
    }
    renderWithProviders(<RouterProvider router={createMemoryRouter([{ path: "/", element:
      <AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}><PhoneEditor /></AppChromeProvider> }])} />);

    const band = await within(await screen.findByTestId("cartel")).findByRole("alert");
    expect(band).toHaveTextContent("Tiene que quedar al menos un Dueño activo.");
    // M-Usuario (.f-banda.mal): el rosa de la banda es un poco más oscuro que el de la franja.
    expect(band).toHaveClass("px-4", "py-3", "text-[14.5px]", "leading-[1.4]", "bg-[var(--peligro-banda)]", "text-[var(--peligro-tx)]");
    expect(band).not.toHaveClass("rounded-xl");
    expect(screen.getByTestId("franja")).toBeEmptyDOMElement();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("sin conexión, un 5xx o un 429 no van en la pantalla: los avisa el MutationCache", async () => {
    for (const error of [ApiError.network(), new ApiError(500, { code: "General.Unexpected" }), new ApiError(429, { code: "General.TooManyRequests", detail: "Esperá un momento." })]) {
      const { unmount } = renderWithProviders(<RouterProvider router={createMemoryRouter([{ path: "/", element: <Editor error={error} /> }])} />);
      expect(await screen.findByRole("heading", { name: "Configuración" })).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      unmount();
    }
  });
});
