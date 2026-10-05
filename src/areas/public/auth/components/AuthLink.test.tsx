import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AuthLink } from "./AuthLink";

// Los enlaces de texto del ingreso y los registros (.lnk de los tableros): la variante link de Button, en `--marca-tx`,
// con la letra del renglón que los lleva.
describe("AuthLink", () => {
  it("es la variante link de Button, con la letra del texto que lo rodea", () => {
    render(<MemoryRouter><p className="text-[13px]">{"¿No tenés cuenta? "}<AuthLink to="/registro">{"Creá una"}</AuthLink></p></MemoryRouter>);

    const link = screen.getByRole("link", { name: "Creá una" });
    expect(link).toHaveAttribute("href", "/registro");
    expect(link).toHaveAttribute("data-variant", "link");
    expect(link).toHaveClass("font-semibold", "text-[var(--marca-tx)]", "hover:underline", "text-[length:inherit]");
    expect(link).not.toHaveClass("text-[14px]");
  });
});
