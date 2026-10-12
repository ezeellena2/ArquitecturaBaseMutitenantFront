import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { MeResponse } from "@/shared/api/types";
import type { AssistantPolicyResponse, UpdateAssistantPolicyRequest } from "@/modules/assistant/api/types";
import type { ModuleOrganizationUiProps } from "@/shared/modules/types";
import { ReasonDialog, type ReasonDialogValues } from "@/shared/platform/ReasonDialog";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { assistantPolicyQueryKey, fetchAssistantPolicy, updateAssistantPolicy } from "../api/policy";
import { assistantPolicyAccess } from "../registration";

interface Confirmation { policy: AssistantPolicyResponse; trigger: HTMLElement | null }
function ownPolicy(value: unknown): AssistantPolicyResponse | undefined {
  return typeof value === "object" && value !== null && "allowOwnKey" in value && typeof value.allowOwnKey === "boolean"
    && "version" in value && typeof value.version === "number" ? { allowOwnKey: value.allowOwnKey, version: value.version } : undefined;
}

export function OrganizationAssistantPolicy(props: ModuleOrganizationUiProps) {
  const { t } = useTranslation("assistant");
  const client = useQueryClient();
  const queryKey = assistantPolicyQueryKey(props.me, props.organization.id);
  const query = useQuery({ queryKey, queryFn: ({ signal }) => fetchAssistantPolicy(props.organization.id, signal), meta: { silent: true } });
  const policy = ownPolicy(props.ownWrite) ?? query.data;
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const editable = props.me.effectivePermissions.platform.includes("platform.tenants.manage");
  const action = policy?.allowOwnKey ? "revoke" : "permit";
  return props.children({
    description: query.error ? <><FormError message={apiErrorMessage(query.error, t)} /><Button variant="outline" size="sm" onClick={() => { void query.refetch(); }}>{t("retry")}</Button></>
      : policy ? t(`policy.description.${policy.allowOwnKey ? "own" : "platform"}`) : undefined,
    actions: policy && !query.error && editable ? [{ label: t(`policy.actions.${action}`), accessibleName: t(`policy.actions.${action}`), icon: KeyRound,
      onSelect: (trigger) => { setConfirmation({ policy: { ...policy }, trigger }); props.onOpenDialog(); } }] : [],
    dialog: props.dialogOpen && confirmation && editable ? <PolicyReasonDialog {...props} confirmation={confirmation}
      onClose={(conflicted) => { if (conflicted) { props.onConflict(); void client.invalidateQueries({ queryKey }); } setConfirmation(null); props.onCloseDialog(); }} /> : null,
  });
}

function PolicyReasonDialog(props: ModuleOrganizationUiProps & { confirmation: Confirmation; onClose: (conflicted: boolean) => void }) {
  const { t } = useTranslation("assistant");
  const client = useQueryClient();
  const conflict = useRef(false);
  const live = useRef(props);
  useLayoutEffect(() => { live.current = props; });
  const scope = props.me;
  const organizationId = props.organization.id;
  const controller = useRef<AbortController | null>(null);
  const operationOwners = useRef(new WeakMap<ReasonDialogValues, AbortController>());
  const acceptedOwner = useRef<AbortController | null>(null);
  useEffect(() => {
    const ownerController = new AbortController(); controller.current = ownerController;
    return () => { ownerController.abort(); if (controller.current === ownerController) controller.current = null; };
  }, []);
  function eligible(expectedOwner: AbortController | null = controller.current) {
    const me = client.getQueryData<MeResponse>(currentUserQueryKey);
    return expectedOwner !== null && controller.current === expectedOwner && !expectedOwner.signal.aborted && live.current.isCurrent() && live.current.dialogOpen && live.current.organization.id === organizationId
      && live.current.organization.status !== "Closed" && live.current.feature.enabled && !!me && me.id === scope.id && me.access === scope.access
      && (me.activeTenantId ?? null) === (scope.activeTenantId ?? null) && assistantPolicyAccess(me) === "allowed"
      && me.effectivePermissions.platform.includes("platform.tenants.manage");
  }
  useEffect(() => client.getQueryCache().subscribe((event) => {
    const removedOwner = event.type === "removed" && (event.query.queryKey[0] === currentUserQueryKey[0]
      || assistantPolicyQueryKey(scope, organizationId).every((part, index) => event.query.queryKey[index] === part));
    if (removedOwner || !eligible()) {
      controller.current?.abort(); live.current.onClose(false);
    }
  }));
  const action = props.confirmation.policy.allowOwnKey ? "revoke" : "permit";
  const allowOwnKey = !props.confirmation.policy.allowOwnKey;
  return <ReasonDialog title={t(`policy.confirm.${action}.title`, { organization: props.organization.name })}
    description={t(`policy.confirm.${action}.description`, { organization: props.organization.name })}
    confirmLabel={t(`policy.confirm.${action}.button`)} pendingLabel={t(`policy.confirm.${action}.pending`)}
    queryRoot={assistantPolicyQueryKey(scope, organizationId)} returnFocusTo={props.confirmation.trigger} onClose={() => {
      const closeOwner = acceptedOwner.current ?? controller.current;
      if (closeOwner && controller.current === closeOwner && !closeOwner.signal.aborted) props.onClose(conflict.current);
    }}
    mutationFn={async (values) => {
      const operationOwner = operationOwners.current.get(values) ?? controller.current;
      if (!operationOwner || !eligible(operationOwner)) throw new DOMException("", "AbortError");
      operationOwners.current.set(values, operationOwner);
      const request: UpdateAssistantPolicyRequest = { allowOwnKey, version: props.confirmation.policy.version, reason: values.reason };
      try {
        const response = await updateAssistantPolicy(organizationId, request, operationOwner.signal);
        if (!eligible(operationOwner)) throw new DOMException("", "AbortError");
        conflict.current = false; return { allowOwnKey, version: response.version };
      } catch (error) {
        if (!eligible(operationOwner)) throw new DOMException("", "AbortError");
        if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") conflict.current = true;
        throw error;
      }
    }} onSuccess={(write, values) => {
      const operationOwner = operationOwners.current.get(values) ?? null;
      if (!eligible(operationOwner)) throw new DOMException("", "AbortError");
      acceptedOwner.current = operationOwner;
      live.current.onWrite(write);
      toast.success(t(`policy.messages.${action}`, { organization: live.current.organization.name }));
      void client.invalidateQueries({ queryKey: assistantPolicyQueryKey(scope, organizationId) });
    }} />;
}
