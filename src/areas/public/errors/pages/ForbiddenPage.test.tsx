import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { ForbiddenPage } from "./ForbiddenPage";

beforeAll(async () => { await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]); });

describe("ForbiddenPage", () => {
  it("reproduce el 403 de Error-Org y vuelve al inicio de la organización", async () => {
    const { container } = render(<MemoryRouter><ForbiddenPage organizationName="Grupo Delta" /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.queryByText(/pedíselo a quien administra/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/org");
    expect(await axe(container)).toHaveNoViolations();
  });
});
