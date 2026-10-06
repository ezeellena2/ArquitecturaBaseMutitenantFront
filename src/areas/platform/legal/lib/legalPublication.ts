import type { LegalDocumentKind } from "@/shared/api/types";

export interface LegalPublicationOperation {
  kind: LegalDocumentKind;
  effectiveOn: string;
  contents: { culture: string; text: string }[];
  draft: number;
}

export function samePublication(previous: LegalPublicationOperation, next: LegalPublicationOperation) {
  return previous.draft === next.draft && previous.kind === next.kind && previous.effectiveOn === next.effectiveOn
    && previous.contents.length === next.contents.length
    && previous.contents.every((content, index) => content.culture === next.contents[index].culture && content.text === next.contents[index].text);
}
