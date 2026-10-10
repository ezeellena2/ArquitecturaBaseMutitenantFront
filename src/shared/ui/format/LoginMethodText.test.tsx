import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { LoginMethodText } from "./LoginMethodText";

it.each(["pa•••@kappa.ejemplo.com", "+54 •••• 1234", "•••• 2204"])("conserva la máscara %s publicada por la API", (value) => {
  renderWithProviders(<LoginMethodText type={value.includes("@") ? "Email" : "Phone"} value={value} />);
  expect(screen.getByText(value)).toBeVisible();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it("un teléfono completo usa el formato central sin convertirlo en enlace", async () => {
  renderWithProviders(<LoginMethodText type="Phone" value="+5491161234567" />);
  expect(await screen.findByText("011 15-6123-4567")).toBeVisible();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
