import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { LoginMethodText } from "./LoginMethodText";

it.each(["pa•••@kappa.ejemplo.com", "+54 •••• 1234", "•••• 2204"])("conserva la máscara %s publicada por la API", (value) => {
  renderWithProviders(<LoginMethodText type={value.includes("@") ? "Email" : "Phone"} value={value} />);
  expect(screen.getByText(value)).toBeVisible();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

// Como los tableros: un correo largo se parte después de la @, no en cualquier letra.
it("un correo se parte después de la @", () => {
  renderWithProviders(<LoginMethodText type="Email" value="pa•••@kappa.ejemplo.com" />);
  expect(screen.getByText("pa•••@kappa.ejemplo.com").innerHTML).toBe("pa•••@<wbr>kappa<wbr>.ejemplo<wbr>.com");
});

it("un teléfono completo usa el formato central sin convertirlo en enlace", async () => {
  renderWithProviders(<LoginMethodText type="Phone" value="+5491161234567" />);
  expect(await screen.findByText("011 15-6123-4567")).toBeVisible();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
