import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import type { CompanyResponse } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { businessE6Admin } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { CompanyDialog } from "./CompanyDialog";

const company: CompanyResponse = {
  id: "company-a10", name: "Empresa A10", taxId: { country: "AR", type: "AR-CUIT", number: "33333333339" },
  timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 1, version: 3,
  createdAtUtc: "2026-09-27T12:00:00Z",
};

function show(country = "AR", saved?: CompanyResponse) {
  const result = renderWithProviders(<CompanyDialog company={saved} onClose={vi.fn()} />);
  act(() => result.queryClient.setQueryData(currentUserQueryKey, {
    ...businessE6Admin, culture: "en-US", organizationCountryCode: country,
  }));
  return result;
}

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("CompanyDialog · identificación del país de la organización", () => {
  it("distingue el largo del verificador de CUIT y envía el válido a 390", async () => {
    const user = userEvent.setup();
    const restore = asPhone();
    const bodies: unknown[] = [];
    server.use(http.post("/api/companies", async ({ request }) => {
      bodies.push(await request.json()); return HttpResponse.json("company-created", { status: 201 });
    }));
    try {
      const { container } = show();
      const tax = await screen.findByRole("textbox", { name: "CUIT" });
      fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Empresa nueva" } });
      fireEvent.change(tax, { target: { value: "3333333333" } });
      fireEvent.click(screen.getByRole("button", { name: "Create company" }));
      await waitFor(() => expect(tax).toHaveAccessibleDescription("Check the CUIT: it has 11 digits."));
      fireEvent.change(tax, { target: { value: "33333333333" } });
      await waitFor(() => expect(tax).toHaveAccessibleDescription("That CUIT is invalid: check the numbers."));
      expect(bodies).toHaveLength(0);
      expect(await axe(container)).toHaveNoViolations();
      await user.clear(tax);
      await user.paste(" 33 . 33333333 . 9 777");
      expect(tax).toHaveValue("33333333339");
      fireEvent.click(screen.getByRole("button", { name: "Create company" }));
      await waitFor(() => expect(bodies).toEqual([{ name: "Empresa nueva", taxIdNumber: "33333333339", timeZoneId: null }]));
    } finally { restore(); }
  });

  it("usa SortOrder y código ordinal, rótulo, máscara y algoritmo del catálogo, aunque la cuenta tenga otra región", async () => {
    const user = userEvent.setup();
    const fixture = referenceDataFixture();
    const cuit = fixture.taxIdTypes[0];
    server.use(http.get("/api/reference-data", () => HttpResponse.json({ ...fixture, taxIdTypes: [
      { ...cuit, sortOrder: 5 },
      { ...cuit, code: "AR-Z-DNI", label: "Otro DNI", name: "Otro DNI", mask: "99999999", validatorKey: "ar-dni-length", appliesTo: "Company", sortOrder: 1 },
      { ...cuit, code: "AR-A-DNI", label: "DNI empresarial", name: "DNI empresarial", mask: "99999999", validatorKey: "ar-dni-length", appliesTo: "Both", sortOrder: 1 },
      { ...cuit, code: "AR-Disabled", isEnabled: false, sortOrder: 0 },
      { ...cuit, code: "AR-Person", appliesTo: "Person", sortOrder: 0 },
    ] })));
    const bodies: unknown[] = [];
    server.use(http.post("/api/companies", async ({ request }) => {
      bodies.push(await request.json()); return HttpResponse.json("company-created", { status: 201 });
    }));
    const { container } = show();
    const tax = await screen.findByRole("textbox", { name: "DNI empresarial" });
    expect(tax).toHaveAttribute("placeholder", "99999999");
    expect(screen.queryByRole("combobox", { name: /Identification/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Empresa DNI" } });
    await user.click(tax);
    await user.paste("12.345.678");
    expect(tax).toHaveValue("12345678");
    await user.clear(tax);
    await user.paste("12.345.6789");
    expect(tax).toHaveValue("12345678");
    fireEvent.click(screen.getByRole("button", { name: "Create company" }));
    await waitFor(() => expect(bodies).toEqual([{ name: "Empresa DNI", taxIdNumber: "12345678", timeZoneId: null }]));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("oculta el número en un país sin tipo empresarial y conserva el guardado al editar otro dato", async () => {
    const bodies: unknown[] = [];
    server.use(http.put("/api/companies/company-a10", async ({ request }) => {
      bodies.push(await request.json()); return HttpResponse.json({ version: 4 });
    }));
    const { container } = show("US", company);
    const name = await screen.findByRole("textbox", { name: "Name" });
    expect(screen.queryByRole("textbox", { name: "CUIT" })).not.toBeInTheDocument();
    fireEvent.change(name, { target: { value: "Empresa renombrada" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(bodies).toEqual([{ name: "Empresa renombrada", taxIdNumber: "33333333339", timeZoneId: company.timeZoneId, version: 3 }]));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("conserva el tipo guardado deshabilitado, y al cambiar el número valida con el tipo empresarial nuevo", async () => {
    const fixture = referenceDataFixture();
    server.use(http.get("/api/reference-data", () => HttpResponse.json({ ...fixture, taxIdTypes: [
      fixture.taxIdTypes[0],
      { ...fixture.taxIdTypes[0], code: "AR-DNI", label: "DNI", name: "DNI", mask: "99999999", validatorKey: "ar-dni-length", isEnabled: false },
    ] })));
    const saved = { ...company, taxId: { country: "AR", type: "AR-DNI", number: "12345678" } };
    const bodies: unknown[] = [];
    server.use(http.put("/api/companies/company-a10", async ({ request }) => {
      bodies.push(await request.json()); return HttpResponse.json({ version: 4 });
    }));
    const { unmount } = show("AR", saved);
    const dni = await screen.findByRole("textbox", { name: "DNI" });
    expect(dni).toHaveValue("12345678");
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Nombre nuevo" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ taxIdNumber: "12345678" });
    unmount();
    show("AR", saved);
    fireEvent.change(await screen.findByRole("textbox", { name: "DNI" }), { target: { value: "12345679" } });
    const cuit = screen.getByRole("textbox", { name: "CUIT" });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(cuit).toHaveAccessibleDescription("Check the CUIT: it has 11 digits."));
    expect(bodies).toHaveLength(1);
    fireEvent.change(cuit, { target: { value: "33333333339" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(bodies.at(-1)).toMatchObject({ taxIdNumber: "33333333339" }));
  });
});
