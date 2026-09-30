import { useCurrentUser } from "@/auth/useCurrentUser";
import { PersonalLoginMethodNotice } from "@/shared/ui/PersonalLoginMethodNotice";

export function PersonalHomePage() {
  const { data } = useCurrentUser();
  return data?.needsPersonalLoginMethod ? <div className="p-3 md:p-6"><PersonalLoginMethodNotice /></div> : null;
}
