import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toastError, Toaster } from "@/shared/ui/sonner";
import { resetBetweenTests } from "./isolation";

describe("resetBetweenTests", () => {
  // sonner guarda los avisos fuera de React y, al montar otro Toaster, vuelve a mostrar los que siguen abiertos: sin
  // cerrarlos entre pruebas, el aviso de una prueba aparece en la siguiente.
  it("los avisos de una prueba no quedan para la siguiente", async () => {
    toastError("Quedó de la prueba anterior.");
    resetBetweenTests();

    render(<Toaster />);
    toastError("Es de esta prueba.");

    // El Toaster muestra los avisos en orden: cuando aparece el de esta prueba, ya habría aparecido el anterior.
    expect(await screen.findByText("Es de esta prueba.")).toBeInTheDocument();
    expect(screen.queryByText("Quedó de la prueba anterior.")).not.toBeInTheDocument();
  });
});
