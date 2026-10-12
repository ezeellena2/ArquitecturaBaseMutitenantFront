import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { companyCandidateOptions, companyOptions, companyRoleOptions, roleOptions, type ResourceOptions } from "@/shared/api/resourceOptions";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { FormField } from "./FormField";
import { SearchSelect } from "./SearchSelect";
import { MultiSelect } from "./MultiSelect";

type Choice = { id: string; name: string; memberId: string; displayName: string };
const choices = Array.from({ length: 101 }, (_, index): Choice => ({
  id: `id-${index + 1}`, name: `Recurso ${index + 1}`, memberId: `id-${index + 1}`, displayName: `Recurso ${index + 1}`,
}));

function Harness<T>({ resource, id, name, multiple = false }: {
  resource: ResourceOptions<T>; id: (item: T) => string; name: (item: T) => string; multiple?: boolean;
}) {
  const query = useResourceOptions(resource);
  const [value, setValue] = useState("");
  const [values, setValues] = useState<string[]>([]);
  const options = query.items.map((item) => ({ value: id(item), label: name(item) }));
  return <>
    <FormField label="Recurso">{multiple
      ? <MultiSelect options={options} selectedOptions={query.knownItems.map((item) => ({ value: id(item), label: name(item) }))}
          value={values} onChange={setValues} placeholder="Elegí" remote={query.remote} />
      : <SearchSelect options={options} value={value} onChange={setValue} selectedLabel={query.knownItems.find((item) => id(item) === value) ? name(query.knownItems.find((item) => id(item) === value)!) : undefined}
          placeholder="Elegí" searchLabel="Buscar" remote={query.remote} />}</FormField>
    <output aria-label="Elegido">{multiple ? values.join(",") : value}</output>
    {multiple ? <button type="button" onClick={() => { void query.allItems().then((items) => setValues(items.map(id))); }}>{"Elegir todos"}</button> : null}
  </>;
}

function mockOptions(route: string) {
  const requests: URL[] = [];
  server.use(http.get(route, ({ request }) => {
    const url = new URL(request.url); requests.push(url);
    const search = url.searchParams.get("search") ?? "";
    const page = Number(url.searchParams.get("page"));
    const size = Number(url.searchParams.get("pageSize"));
    const matches = choices.filter((item) => item.name.includes(search));
    const totalPages = Math.ceil(matches.length / size);
    return HttpResponse.json({ items: matches.slice((page - 1) * size, page * size), page, pageSize: size,
      totalCount: matches.length, totalPages, hasPrevious: page > 1, hasNext: page < totalPages });
  }));
  return requests;
}

async function search(value: string) {
  act(() => screen.getByRole("searchbox", { name: "Buscar" }).focus());
  vi.useFakeTimers();
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), { target: { value } });
  await act(async () => { await vi.advanceTimersByTimeAsync(300); });
  vi.useRealTimers();
}

afterEach(() => vi.useRealTimers());

describe("opciones remotas compartidas", () => {
  const cases = [
    { label: "empresa", route: "/api/companies/paged", element: <Harness resource={companyOptions} id={(item) => item.id} name={(item) => item.name} /> },
    { label: "rol", route: "/api/roles/paged", element: <Harness resource={roleOptions("Organization")} id={(item) => item.id} name={(item) => item.name} /> },
    { label: "rol de empresa", route: "/api/companies/company-1/roles/paged", element: <Harness resource={companyRoleOptions("company-1", true)} id={(item) => item.id} name={(item) => item.name} /> },
  ];

  for (const testCase of cases) it(`busca y elige ${testCase.label} 101 en el servidor y conserva su etiqueta fuera de la página`, async () => {
    const requests = mockOptions(testCase.route);
    const user = userEvent.setup();
    const { container } = renderWithProviders(testCase.element);
    await user.click(screen.getByRole("combobox", { name: "Recurso" }));
    await screen.findByRole("option", { name: "Recurso 1" });
    await search("101");
    await user.click(await screen.findByRole("option", { name: "Recurso 101" }));
    expect(screen.getByRole("status", { name: "Elegido" })).toHaveTextContent("id-101");
    await user.click(screen.getByRole("combobox", { name: "Recurso" }));
    await search("");
    await screen.findByRole("option", { name: "Recurso 1" });
    expect(screen.getByRole("combobox", { name: "Recurso" })).toHaveTextContent("Recurso 101");
    expect(requests.some((request) => request.searchParams.get("search") === "101")).toBe(true);
    expect(requests.every((request) => request.searchParams.get("pageSize") === "10")).toBe(true);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("busca la persona 101 sin buscar por su correo enmascarado", async () => {
    const requests = mockOptions("/api/companies/company-1/candidates/paged");
    const user = userEvent.setup();
    renderWithProviders(<Harness resource={companyCandidateOptions("company-1")} id={(item) => item.memberId} name={(item) => item.displayName} />);
    await user.click(screen.getByRole("combobox", { name: "Recurso" }));
    await screen.findByRole("option", { name: "Recurso 1" });
    await search("101");
    await user.click(await screen.findByRole("option", { name: "Recurso 101" }));
    expect(screen.getByRole("status", { name: "Elegido" })).toHaveTextContent("id-101");
    expect(requests.at(-1)?.searchParams.get("sort")).toBe("displayName");
  });

  it("carga otra página y conserva la selección múltiple al cambiar la búsqueda", async () => {
    mockOptions("/api/roles/paged");
    const user = userEvent.setup();
    renderWithProviders(<Harness resource={roleOptions("Organization")} id={(item) => item.id} name={(item) => item.name} multiple />);
    screen.getByRole("button", { name: "Recurso" }).focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menuitemcheckbox", { name: "Recurso 1" });
    await user.click(screen.getByRole("button", { name: "Cargar más" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Recurso 11" }));
    await search("101");
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Recurso 101" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Recurso" })).toHaveTextContent("Recurso 11, Recurso 101");
    expect(screen.getByRole("status", { name: "Elegido" })).toHaveTextContent("id-11,id-101");
  });

  it("comparte la página entre consumidores y una mutación invalida las opciones por la raíz", async () => {
    const requests = mockOptions("/api/companies/paged");
    const { queryClient } = renderWithProviders(<><Harness resource={companyOptions} id={(item) => item.id} name={(item) => item.name} />
      <Harness resource={companyOptions} id={(item) => item.id} name={(item) => item.name} /></>);
    await waitFor(() => expect(requests).toHaveLength(1));
    await act(async () => { await queryClient.invalidateQueries({ queryKey: ["companies"] }); });
    expect(requests).toHaveLength(2);
  });

  it("muestra el error del selector y reintenta sin perder el teclado", async () => {
    let fail = true;
    server.use(http.get("/api/companies/paged", () => fail
      ? HttpResponse.json({ status: 400, code: "Validation.Failed", detail: "No se pudo leer.", traceId: "test" }, { status: 400 })
      : HttpResponse.json({ items: [choices[0]], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })));
    const user = userEvent.setup();
    renderWithProviders(<Harness resource={companyOptions} id={(item) => item.id} name={(item) => item.name} />);
    await user.click(screen.getByRole("combobox", { name: "Recurso" }));
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    fail = false;
    await user.click(retry);
    await screen.findByRole("option", { name: "Recurso 1" });
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("status", { name: "Elegido" })).toHaveTextContent("id-1");
  });

  it("«Todos» lee las páginas restantes y también incluye el rol 101", async () => {
    const requests = mockOptions("/api/roles/paged");
    const user = userEvent.setup();
    renderWithProviders(<Harness resource={roleOptions("Organization")} id={(item) => item.id} name={(item) => item.name} multiple />);
    await user.click(screen.getByRole("button", { name: "Elegir todos" }));
    await waitFor(() => expect(screen.getByRole("status", { name: "Elegido" })).toHaveTextContent("id-101"));
    expect(screen.getByRole("status", { name: "Elegido" }).textContent?.split(",")).toHaveLength(101);
    expect(new Set(requests.map((request) => request.searchParams.get("page"))).size).toBe(11);
  });
});
