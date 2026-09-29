import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { beginSignOut, cancelSignOut, useIsSigningOut } from "./signOutStatus";

function SignOutProbe() {
  return <output>{useIsSigningOut() ? "Cerrando" : "Activo"}</output>;
}

describe("signOutStatus", () => {
  afterEach(() => cancelSignOut());

  it("publica el cierre y vuelve atrás si falló signoutRedirect", () => {
    render(<SignOutProbe />);
    expect(screen.getByRole("status")).toHaveTextContent("Activo");

    act(() => beginSignOut());
    expect(screen.getByRole("status")).toHaveTextContent("Cerrando");

    act(() => cancelSignOut());
    expect(screen.getByRole("status")).toHaveTextContent("Activo");
  });
});
