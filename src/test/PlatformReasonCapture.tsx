import { useState } from "react";
import { ApiError } from "@/shared/api/ApiError";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { platformReasons } from "./mocks/platformReasons";

// T20d verifica el componente real; las listas y fichas de fondo se incorporan en T21–T23.
export function PlatformReasonCapture({ fixtureKey }: { fixtureKey: string }) {
  const [open, setOpen] = useState(true);
  const fixture = platformReasons[fixtureKey as keyof typeof platformReasons];
  if (!fixture) throw new Error(`Confirmación visual desconocida: ${fixtureKey}`);
  if (!open) return null;
  return <ReasonDialog
    title={fixture.title} description={fixture.description}
    confirmLabel={fixture.confirmLabel} pendingLabel={fixture.pendingLabel} destructive={fixture.destructive}
    date={"date" in fixture ? fixture.date : undefined}
    blockedReason={"blockedReason" in fixture ? fixture.blockedReason : undefined}
    onClose={() => setOpen(false)} queryRoot={["platform", "reason-capture"]}
    stateConflictCodes={["Tenancy.Tenant.InvalidTransition", "Users.User.InvalidTransition", "Legal.AccountDeletion.AlreadyPending", "Platform.AccountRecovery.AlreadyResolved"]}
    mutationFn={() => "failure" in fixture ? Promise.reject(new ApiError(409, fixture.failure)) : Promise.resolve({ version: 2 })}
    onSuccess={() => undefined}
  />;
}
