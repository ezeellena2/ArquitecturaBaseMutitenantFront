import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { NotFoundPage } from "./NotFoundPage";

beforeAll(async () => { await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]); });

describe("NotFoundPage", () => {
  it("reproduce el 404 de Error-Org", async () => {
    const { container } = render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    expect(screen.getByText("Puede que la hayan borrado o que la dirección esté mal.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/org");
    expect(await axe(container)).toHaveNoViolations();
  });
});
