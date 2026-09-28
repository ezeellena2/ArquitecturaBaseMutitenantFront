import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import App from "./App";

describe("App", () => {
  it("monta la ruta vacía", () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
