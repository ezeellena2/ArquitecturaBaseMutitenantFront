import { render } from "@testing-library/react";
import { ChevronDown, Plus } from "lucide-react";
import { describe, expect, it } from "vitest";
import { IconDefaults } from "./IconDefaults";

// Los tableros dibujan los íconos con trazo 1.75 (Criterio · Marco, .ab-sidebar__link, .ini-ico); lucide trae 2. El trazo
// del set se fija una sola vez, en la raíz de la app: un ícono que pide otro trazo lo sigue pidiendo.
describe("IconDefaults", () => {
  it("da a los íconos de lucide el trazo de los tableros", () => {
    const { container } = render(<IconDefaults><ChevronDown /><Plus strokeWidth={2.25} /></IconDefaults>);
    const [chevron, plus] = container.querySelectorAll("svg");

    expect(chevron).toHaveAttribute("stroke-width", "1.75");
    expect(plus).toHaveAttribute("stroke-width", "2.25");
  });
});
