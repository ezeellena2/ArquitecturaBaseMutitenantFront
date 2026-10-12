import type { AssistantErrorEventResponse, AssistantStartEventResponse, AssistantStreamHttpResponse, AssistantTitleEventResponse, AssistantToolEventResponse, AssistantTurnResultResponse, SendAssistantMessageRequest } from "@/modules/assistant/api/types";

/** Proyección efímera: start no trae fechas ni versiones de mensajes. */
export interface AssistantTurnState {
  conversationId: string;
  request: SendAssistantMessageRequest;
  phase: "sending" | "consulting" | "writing" | "reconciling" | "Complete" | "Stopped" | "Failed";
  start?: AssistantStartEventResponse;
  text: string;
  sequence: number;
  tools: readonly AssistantToolEventResponse[];
  title?: AssistantTitleEventResponse;
  result?: AssistantTurnResultResponse;
  error?: AssistantErrorEventResponse;
}

export function beginAssistantTurn(conversationId: string, request: SendAssistantMessageRequest): AssistantTurnState {
  return { conversationId, request, phase: "sending", text: "", sequence: -1, tools: [] };
}

export function isAssistantTurnPending(turn: AssistantTurnState | null | undefined): boolean {
  return !!turn && ["sending", "consulting", "writing", "reconciling"].includes(turn.phase);
}

export function reduceAssistantTurn(state: AssistantTurnState, event: AssistantStreamHttpResponse): AssistantTurnState {
  if (!isAssistantTurnPending(state)) return state;
  switch (event.event) {
    case "start":
      return state.start ? state : { ...state, start: event.data, phase: "consulting" };
    case "title":
      return event.data.conversationId !== state.conversationId || (state.title && event.data.version === state.title.version)
        ? state : { ...state, title: event.data };
    case "delta":
      return !state.start || event.data.turnId !== state.start.turnId || event.data.sequence <= state.sequence
        ? state : { ...state, phase: "writing", sequence: event.data.sequence, text: state.text + event.data.text };
    case "tool": {
      if (!state.start || event.data.turnId !== state.start.turnId) return state;
      const existing = state.tools.find((tool) => tool.toolKey === event.data.toolKey);
      if (existing && existing.state !== "running") return state;
      return { ...state, tools: [...state.tools.filter((tool) => tool.toolKey !== event.data.toolKey), event.data] };
    }
    case "done":
      if (state.start && (event.data.turnId !== state.start.turnId || event.data.message.id !== state.start.assistantMessageId)) return state;
      return { ...state, result: event.data, text: event.data.message.text, phase: event.data.message.status === "Generating" ? "reconciling" : event.data.message.status };
    case "error":
      if (event.data.turnId && state.start && event.data.turnId !== state.start.turnId) return state;
      return { ...state, error: event.data, phase: "Failed" };
  }
}
