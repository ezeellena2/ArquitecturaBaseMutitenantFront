import { describe, expect, it } from "vitest";
import { mainSiteHost, mainSiteUrl, publicSiteHost, publicSiteSuffix, publicSiteUrl, siteOfHost } from "./publicSite";

const issuer = "https://example.test:5174/";

describe("sitio del host (accesos-y-permisos.md, SubdomainTests del backend)", () => {
  it.each(["example.test:5174", "EXAMPLE.TEST:5174"])("el dominio principal es el host del issuer: %s", (host) => {
    expect(siteOfHost(host, issuer)).toEqual({ kind: "main" });
  });

  it.each(["empresa-a.example.test:5174", "EMPRESA-A.EXAMPLE.TEST:5174", "a.example.test:5174"])(
    "una sola etiqueta válida resuelve la organización: %s", (host) => {
      expect(siteOfHost(host, issuer)).toEqual({ kind: "storefront", slug: host.split(".")[0].toLowerCase() });
    },
  );

  it.each([
    "a.b.example.test:5174", "empresa-a.other.test:5174", "empresa-a.example.test.evil.test:5174",
    "127.0.0.1:5174", "[::1]:5174", "empresa-a.example.test:5175", "empresa-a.example.test",
    "example.test:5175", "ab.example.test:5174", "-empresa.example.test:5174", "empresa-.example.test:5174",
    "empresa_.example.test:5174", "émpresa.example.test:5174", " empresa-a.example.test:5174",
    "empresa-a.example.test:5174 ", "empresa-a.example.test:5174/", "user@empresa-a.example.test:5174",
    "empresa-a.example.test:5174\n", "empresa-a.example.test:5174\r\n",
    "empresa-a.example.test:65536", `${"a".repeat(64)}.example.test:5174`,
  ])("rechaza el host sin normalizar lo inválido: %s", (host) => {
    expect(siteOfHost(host, issuer)).toEqual({ kind: "unknown" });
  });

  it("admite el puerto HTTPS predeterminado y una etiqueta de 63 caracteres", () => {
    expect(siteOfHost("empresa.example.test", "https://example.test/")).toEqual({ kind: "storefront", slug: "empresa" });
    expect(siteOfHost("empresa.example.test:443", "https://example.test/")).toEqual({ kind: "storefront", slug: "empresa" });
    expect(siteOfHost("empresa.example.test:80", "https://example.test/")).toEqual({ kind: "unknown" });
    expect(siteOfHost(`${"a".repeat(63)}.example.test:5174`, issuer)).toEqual({ kind: "storefront", slug: "a".repeat(63) });
  });

  it("un issuer IP nunca resuelve una página de organización", () => {
    expect(siteOfHost("empresa.127.0.0.1:5174", "https://127.0.0.1:5174/")).toEqual({ kind: "unknown" });
    expect(siteOfHost("empresa.[::1]:5174", "https://[::1]:5174/")).toEqual({ kind: "unknown" });
  });
});

describe("una sola dirección pública", () => {
  it("comparte dominio, sufijo, URL y puerto del issuer de desarrollo", () => {
    expect(mainSiteHost).toBe("localtest.me:5174");
    expect(publicSiteSuffix).toBe(".localtest.me:5174");
    expect(publicSiteHost("grupo-delta")).toBe("grupo-delta.localtest.me:5174");
    expect(publicSiteHost("")).toBe(publicSiteSuffix);
    expect(publicSiteUrl("grupo-delta")).toBe("https://grupo-delta.localtest.me:5174/");
    expect(mainSiteUrl("/cuenta")).toBe("https://localtest.me:5174/cuenta");
  });

  it("conserva el dominio completo del issuer y limpia su path en la URL pública", () => {
    expect(publicSiteUrl("DELTA", "https://portal.example.co.uk:8443/auth/")).toBe("https://delta.portal.example.co.uk:8443/");
    expect(mainSiteUrl("/empresas?search=Delta#lista", issuer)).toBe("https://example.test:5174/empresas?search=Delta#lista");
  });

  it("no permite escapar al origen principal ni navegar a un slug inválido", () => {
    expect(() => mainSiteUrl("//evil.test/cuenta")).toThrow(RangeError);
    expect(() => mainSiteUrl("https://evil.test/cuenta")).toThrow(RangeError);
    expect(() => publicSiteUrl("a.b")).toThrow(RangeError);
    expect(() => publicSiteUrl("ab")).toThrow(RangeError);
    expect(() => publicSiteUrl("delta\n")).toThrow(RangeError);
  });
});
