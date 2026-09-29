import { UserManager } from "oidc-client-ts";
import { authConfig } from "@/auth/authConfig";

// El iframe solo completa el callback y comunica el resultado a la ventana principal.
void new UserManager(authConfig).signinSilentCallback();
