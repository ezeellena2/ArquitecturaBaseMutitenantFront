// Lo único que ven el módulo del asistente y las áreas: se hablan solo por acá (ADR 0068; boundaries.test.ts).
export type { AssistantActionContract, AssistantActionContractField, AssistantActionFieldType, AssistantActionKey } from "@/shared/api/generated/assistant-actions";
export { assistantProposalQueryKey } from "./api";
export type {
  AssistantProposalChanges, AssistantProposalFieldValue, AssistantProposalOption, AssistantProposalRow, AssistantProposalValues,
} from "./operations";
export { emptyAssistantProposalValues } from "./operations";
export {
  AssistantActionRegistryProvider, assistantActionKey, assistantProposalParam, findAssistantActionAdapter, useAssistantActionAdapter,
  useAssistantActionAdapters, withAssistantProposal, type AssistantActionAdapter,
} from "./registry";
export { assistantProposalAlreadySaved, useAssistantProposal, useAssistantProposalQuery, type AssistantProposal } from "./useAssistantProposal";
