import { HttpResponse, http } from "msw";
import { expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { addLoginMethod } from "@/shared/account/api/loginMethods";
import { toLoginDestinationRequest } from "../lib/loginDestination";
import { requestLoginCode, verifyLoginCode } from "./loginCode";
import { requestSignup, verifySignup } from "./signup";
import { requestBusinessSignupCode, verifyBusinessSignupCode } from "./businessSignup";
import { previewAccountRecovery, requestRecoveryCode, verifyRecoveryCode, submitAccountRecovery } from "./recovery";

it("envía los contratos Phone de login/alta/método/recuperación con país+número, OTP y nonce sólo en cuerpos", async () => {
  const calls: Array<{ path: string; body: unknown; key: string | null }> = [];
  server.use(http.post("/api/*", async ({ request }) => {
    const url = new URL(request.url);
    expect(url.search).toBe("");
    calls.push({ path: url.pathname, body: await request.json(), key: request.headers.get("Idempotency-Key") });
    if (url.pathname === "/api/auth/login-code/verify") return HttpResponse.json({ returnUrl: "/" });
    if (url.pathname === "/api/account-recovery") return new HttpResponse(null, { status: 202 });
    if (url.pathname.endsWith("/verify") || url.pathname.endsWith("/preview")) return new HttpResponse(null, { status: 204 });
    if (url.pathname === "/api/me/login-methods") return HttpResponse.json({ methodId: "new-phone", resendAfterSeconds: 60 }, { status: 202 });
    return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
  }));
  const destination = toLoginDestinationRequest({ type: "phone", phone: { country: "AR", number: "011 15-2345-6789" } });
  const signup = { ...destination, acceptedTerms: true, culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires" };
  await requestLoginCode(destination, "login");
  await verifyLoginCode({ ...destination, code: "123456", returnUrl: "/" }, "verify");
  await requestSignup(signup, "signup");
  await verifySignup({ ...signup, code: "123456" }, "signup-verify");
  await requestBusinessSignupCode(signup, "business");
  await verifyBusinessSignupCode({ ...signup, code: "123456" }, "business-verify");
  await addLoginMethod(destination, "method");
  const previousPhone = { country: "UY", number: "094 123 456" };
  await previewAccountRecovery({ previousPhone });
  await requestRecoveryCode({ ...destination, nonce: "nonce-body" }, "recovery");
  await verifyRecoveryCode({ ...destination, nonce: "nonce-body", code: "123456" }, "recovery-verify");
  await submitAccountRecovery({ ...destination, nonce: "nonce-body", previousPhone }, "recovery-submit");
  expect(calls).toEqual([
    { path: "/api/auth/login-code", body: destination, key: "login" },
    { path: "/api/auth/login-code/verify", body: { ...destination, code: "123456", returnUrl: "/" }, key: "verify" },
    { path: "/api/auth/signup", body: signup, key: "signup" },
    { path: "/api/auth/signup/verify", body: { ...signup, code: "123456" }, key: "signup-verify" },
    { path: "/api/auth/business-signup/code", body: signup, key: "business" },
    { path: "/api/auth/business-signup/verify", body: { ...signup, code: "123456" }, key: "business-verify" },
    { path: "/api/me/login-methods", body: destination, key: "method" },
    { path: "/api/account-recovery/preview", body: { previousPhone }, key: null },
    { path: "/api/account-recovery/code", body: { ...destination, nonce: "nonce-body" }, key: "recovery" },
    { path: "/api/account-recovery/verify", body: { ...destination, nonce: "nonce-body", code: "123456" }, key: "recovery-verify" },
    { path: "/api/account-recovery", body: { ...destination, nonce: "nonce-body", previousPhone }, key: "recovery-submit" },
  ]);
});
