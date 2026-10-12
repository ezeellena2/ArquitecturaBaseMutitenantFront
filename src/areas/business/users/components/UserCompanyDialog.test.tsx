import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { UserCompanyDialog } from "./UserCompanyDialog";

const company = (id: string, name: string) => ({ id, name, status: "Active" as const, taxId: null,
  timeZoneId: "America/Argentina/Buenos_Aires", memberCount: 1, version: 1, createdAtUtc: "2026-10-12T12:00:00Z" });
const role = (id: string, companyId: string) => ({ id, name: id, scope: "SpecificCompany" as const, companyId,
  isSystemRole: false, description: null, userCount: 0, permissions: [], version: 1, createdAtUtc: "2026-10-12T12:00:00Z" });
const page = <T,>(items: T[], hasNext = false) => ({ items, page: 1, pageSize: 10, totalCount: hasNext ? 11 : items.length,
  totalPages: hasNext ? 2 : 1, hasPrevious: false, hasNext });

it("cambiar de empresa descarta el Todos que todavía está leyendo roles de la anterior", async () => {
  let releaseOldRequest: () => void = () => {};
  const oldRequest = new Promise<void>((resolve) => { releaseOldRequest = resolve; });
  let readingOldPage = false;
  server.use(
    http.get("/api/companies/paged", () => HttpResponse.json(page([company("a", "Empresa A"), company("b", "Empresa B")]))),
    http.get("/api/roles/paged", async ({ request }) => {
      const query = new URL(request.url).searchParams;
      if (query.get("companyId") === "a" && query.get("page") === "2") {
        readingOldPage = true;
        await oldRequest;
        return HttpResponse.json(page([role("role-a-11", "a")]));
      }
      return HttpResponse.json(page([role(`role-${query.get("companyId")}-1`, query.get("companyId")!)], query.get("companyId") === "a"));
    }),
  );
  const saved = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<UserCompanyDialog mode="add" assignment={{ companyId: "a", roleIds: [] }} companyName="Empresa A"
    companies={[]} roles={[]} pending={false} error={null} onEdit={() => {}} onSave={saved} onClose={() => {}} />);
  await waitFor(() => expect(screen.getByRole("checkbox", { name: "Todos" })).toBeEnabled());
  await user.click(screen.getByRole("checkbox", { name: "Todos" }));
  await waitFor(() => expect(readingOldPage).toBe(true));
  screen.getByRole("combobox", { name: "Empresa" }).focus();
  await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("option", { name: "Empresa B" }));
  await act(async () => { releaseOldRequest(); await oldRequest; });
  await waitFor(() => expect(screen.getByRole("checkbox", { name: "Todos" })).toBeEnabled());
  await user.click(screen.getByRole("button", { name: "Sumar" }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith({ companyId: "b", roleIds: [] }));
});
