import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { Spinner } from "./Spinner";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

describe("Spinner", () => {
  it("anuncia la carga en el idioma activo y oculta el aro decorativo", () => {
    const { container } = render(<Spinner />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("no anuncia dos estados cuando ya vive dentro de un estado accesible", () => {
    const { container } = render(<Spinner decorative />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("traduce el estado de carga", async () => {
    await changeCulture("en-US");
    try {
      render(<Spinner />);
      expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    } finally {
      await changeCulture("es-AR");
    }
  });
});
