import { domainPage } from "./domainPage";
import type { ApiSchemas } from "@/shared/api/types";
import { platformOrganizationCaptureResponses, platformOrganizationTestFeatures as TestFeatures } from "./platformOrganization.ts";

// TestFeatures del tablero v111: datos de prueba, nunca catálogo del producto.
const domain: ApiSchemas["OrganizationDomainResponse"] = {
  id: "domain-1", domain: "delta.ejemplo.com", status: "Pending", txtRecordName: "delta.ejemplo.com",
  txtRecordValue: "ab-verificacion=7f3c9a2e41b8d605", createdAtUtc: "2026-01-12T11:40:00Z",
  verifiedAtUtc: null, version: 1, managedEmailCount: 1,
};
const publicPage: ApiSchemas["PlatformPublicSiteResponse"] = {
  slug: "delta", name: "Grupo Delta", isPublished: true, publishedAtUtc: "2026-02-15T11:40:00Z",
  publishBlockedAtUtc: null, publishBlockedReason: null, version: 1,
};

export function platformOrganizationAdministrationCaptureResponses({ pendingDomain = false, pageState = "Published" } = {}) {
  const page: ApiSchemas["PlatformPublicSiteResponse"] = { ...publicPage,
    ...(pageState !== "Published" ? { isPublished: false, publishedAtUtc: null } : {}),
    ...(pageState === "Blocked" ? { publishBlockedAtUtc: "2026-09-25T13:15:00Z", publishBlockedReason: "Datos de contacto falsos." } : {}),
  };
  const domains: ApiSchemas["OrganizationDomainResponse"][] = [{ ...domain,
    ...(pendingDomain ? {} : { status: "Verified" as const, txtRecordName: null, txtRecordValue: null, verifiedAtUtc: "2026-01-12T12:03:00Z" }),
  }];
  return [
    ...platformOrganizationCaptureResponses().filter((item) => !item.path.endsWith("/features")),
    { method: "GET", path: "/api/platform/tenants/tenant-1/features", status: 200, body: TestFeatures },
    { method: "GET", path: "/api/platform/tenants/tenant-1/domains/paged", status: 200, body: domainPage(domains) },
    { method: "GET", path: "/api/platform/tenants/tenant-1/public-site", status: 200, body: page },
    ...TestFeatures.map((feature) => ({ method: "PUT", path: `/api/platform/tenants/tenant-1/features/${encodeURIComponent(feature.key)}`, status: 200, body: { version: 2 } })),
    { method: "POST", path: "/api/platform/tenants/tenant-1/domains/delta.ejemplo.com/verify", status: 200, body: { version: 2 } },
    { method: "DELETE", path: "/api/platform/tenants/tenant-1/domains/delta.ejemplo.com", status: 204 },
    ...["unpublish", "allow-publish"].map((action) => ({ method: "POST", path: `/api/platform/tenants/tenant-1/public-site/${action}`, status: 200, body: { version: 2 } })),
  ];
}
