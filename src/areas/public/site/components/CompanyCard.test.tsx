import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompanyCard } from "./CompanyCard";

describe("CompanyCard", () => {
  it("el logo se baja recién cuando la tarjeta se acerca a la vista, con su tamaño de 44 px", () => {
    const { container } = render(<CompanyCard company={{ slug: "grupo-delta", name: "Grupo Delta", logoUrl: "/api/directory/grupo-delta/logo" }} />);
    const logo = container.querySelector("img");
    expect(logo).toHaveAttribute("loading", "lazy");
    expect(logo).toHaveAttribute("decoding", "async");
    expect(logo).toHaveAttribute("width", "44");
    expect(logo).toHaveAttribute("height", "44");
  });

  it("sin logo muestra las iniciales", () => {
    const { container } = render(<CompanyCard company={{ slug: "grupo-delta", name: "Grupo Delta", logoUrl: null }} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("GD");
  });
});
