import type { AccountLoginMethod } from "@/shared/api/types";
import { AddLoginMethodDialog } from "./AddLoginMethodDialog";

export function VerifyLoginMethodDialog(props: { method: AccountLoginMethod; open: boolean; onOpenChange: (open: boolean) => void; onComplete: () => void }) {
  return <AddLoginMethodDialog {...props} />;
}
