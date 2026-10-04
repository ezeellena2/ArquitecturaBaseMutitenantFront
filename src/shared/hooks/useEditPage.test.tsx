import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Link, RouterProvider, createMemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { configureI18n } from "@/shared/i18n";
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
function Editor({ error, onSeeNew = () => {}, onContinueEditing = () => {} }: { error?: unknown; onSeeNew?: () => void; onContinueEditing?: () => void }) {
  const [dirty, setDirty] = useState(false);
  const edit = useEditPage({ isDirty: dirty, error, onSeeNew, onContinueEditing });

  return <>
    <h1>{"Configuración"}</h1>
    <p data-testid="banda">{edit.unsaved}</p>
    {edit.banner}
    {edit.formError}
    <button type="button" onClick={() => setDirty(true)}>{"Cambiar algo"}</button>
    <Link to="/empresas">{"Empresas"}</Link>
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
    expect(screen.queryByRole("button", { name: "Ver lo nuevo" })).not.toBeInTheDocument();
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
