import { api } from "@/shared/api/httpClient";
import { accountPaths } from "@/shared/api/accountContract";
import type { LoginLinkPreviewResponse, LoginLinkRedeemResponse, PreviewLoginLinkRequest, RedeemLoginLinkRequest } from "@/shared/api/types";

/** Vista previa sin consumo. El token sólo viaja en el cuerpo. */
export const previewLoginLink = (input: PreviewLoginLinkRequest): Promise<LoginLinkPreviewResponse> =>
  api.post<LoginLinkPreviewResponse>(accountPaths.loginLinkPreview, input);

/** Continuar consume el enlace y crea la sesión Consumer; OIDC se inicia después en la pantalla. */
export const redeemLoginLink = (input: RedeemLoginLinkRequest, key: string): Promise<LoginLinkRedeemResponse> =>
  api.post<LoginLinkRedeemResponse>(accountPaths.loginLinkRedeem, { ...input, access: "consumer" },
    { headers: { "Idempotency-Key": key } });
