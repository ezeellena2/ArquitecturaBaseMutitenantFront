import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { RemoteOptionFooter } from "@/shared/ui/RemoteOptionControls";
import type { WhatsAppConversationRowResponse } from "../../api/types";
import { countOf } from "../../lib/values";
import { transferPeopleOptions, transferTeamOptions, type ChatsScope } from "../api/chats";

/** A quién se pasa: un equipo o una persona del equipo del chat. */
export type TransferTarget = { teamId: string } | { memberId: string };

function useTransferOptions(scope: ChatsScope, row: WhatsAppConversationRowResponse, open: boolean) {
  const { t } = useTranslation("whatsapp");
  const teams = useResourceOptions(transferTeamOptions(scope, row.id), open);
  const people = useResourceOptions(transferPeopleOptions(scope, row.id), open);
  return {
    teams, people,
    peopleTitle: row.team ? t("chats.transfer.teamPeople", { team: row.team.name }) : t("chats.transfer.people"),
    empty: !teams.isPending && !people.isPending && teams.items.length === 0 && people.items.length === 0,
  };
}

/// «Pasar» en la compu (WA-Chats-Pasar, .o-menu): el menú «Pasar a» con los equipos y su cantidad de personas y, debajo,
/// las personas del equipo con los chats que ya tienen tomados (CC01).
export function TransferDropdown({ scope, row, pending, onTransfer }: {
  scope: ChatsScope;
  row: WhatsAppConversationRowResponse;
  pending: boolean;
  onTransfer: (target: TransferTarget) => void;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const [open, setOpen] = useState(false);
  const { teams, people, peopleTitle, empty } = useTransferOptions(scope, row, open);
  return <DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="sm" pending={pending}>{t("chats.header.transfer")}</Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" aria-label={t("chats.transfer.title")} className="w-[260px]">
      {teams.items.length > 0 ? <DropdownMenuGroup>
        <DropdownMenuLabel className="pt-2 pb-1 text-[12px] font-semibold text-[var(--t3)] lg:text-[12px]">{t("chats.transfer.teams")}</DropdownMenuLabel>
        {teams.items.map((team) => <DropdownMenuItem key={team.id} onSelect={() => onTransfer({ teamId: team.id })} className="flex-col items-start gap-0 py-[7px] text-[13.5px] leading-[1.35]">
          {team.name}<span className="text-[12px] text-[var(--t3)]">{t("chats.transfer.memberCount", countOf(format, team.memberCount))}</span>
        </DropdownMenuItem>)}
        <RemoteOptionFooter remote={teams.remote} />
      </DropdownMenuGroup> : null}
      {teams.items.length > 0 && people.items.length > 0 ? <DropdownMenuSeparator className="my-1 h-px border-0 bg-[var(--borde)]" /> : null}
      {people.items.length > 0 ? <DropdownMenuGroup>
        <DropdownMenuLabel className="pt-2 pb-1 text-[12px] font-semibold text-[var(--t3)] lg:text-[12px]">{peopleTitle}</DropdownMenuLabel>
        {people.items.map((person) => <DropdownMenuItem key={person.id} onSelect={() => onTransfer({ memberId: person.id })} className="flex-col items-start gap-0 py-[7px] text-[13.5px] leading-[1.35]">
          {person.name}<span className="text-[12px] text-[var(--t3)]">{t("chats.transfer.takenCount", countOf(format, person.takenCount))}</span>
        </DropdownMenuItem>)}
        <RemoteOptionFooter remote={people.remote} />
      </DropdownMenuGroup> : null}
      {teams.isPending || people.isPending ? <p role="status" className="px-3.5 py-2 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p> : null}
      {empty ? <p className="px-3.5 py-2 text-[13px] text-[var(--t2)]">{t("chats.transfer.empty")}</p> : null}
    </DropdownMenuContent>
  </DropdownMenu>;
}

/// «Pasar» en el teléfono (M-WA-Chats-Pasar, .ap-hoja): la hoja «Pasar a» con las mismas dos listas. La abre el ⋮ de la
/// barra, que se va con su menú: el foco vuelve a ese botón.
export function TransferSheet({ scope, row, onTransfer, onClose, returnFocusTo }: {
  scope: ChatsScope;
  row: WhatsAppConversationRowResponse;
  onTransfer: (target: TransferTarget) => void;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const { teams, people, peopleTitle, empty } = useTransferOptions(scope, row, true);
  const choose = (target: TransferTarget) => { onTransfer(target); onClose(); };
  const item = "flex min-h-[54px] w-full flex-col items-start justify-center border-t border-[var(--borde)] px-5 py-2 text-left text-[15.5px] first-of-type:border-t-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]";
  const title = "px-5 pt-2.5 pb-1 text-[13px] font-semibold text-[var(--t3)]";
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("chats.transfer.title")}</DialogTitle></DialogHeader>
      <div className="flex flex-col pt-1 pb-[calc(8px+env(safe-area-inset-bottom))]">
        {teams.items.length > 0 ? <section aria-label={t("chats.transfer.teams")}>
          <h3 className={title}>{t("chats.transfer.teams")}</h3>
          {teams.items.map((team) => <button key={team.id} type="button" className={item} onClick={() => choose({ teamId: team.id })}>
            {team.name}<span className="text-[13px] text-[var(--t3)]">{t("chats.transfer.memberCount", countOf(format, team.memberCount))}</span>
          </button>)}
          <RemoteOptionFooter remote={teams.remote} />
        </section> : null}
        {people.items.length > 0 ? <section aria-label={peopleTitle}>
          <h3 className={title}>{peopleTitle}</h3>
          {people.items.map((person) => <button key={person.id} type="button" className={item} onClick={() => choose({ memberId: person.id })}>
            {person.name}<span className="text-[13px] text-[var(--t3)]">{t("chats.transfer.takenCount", countOf(format, person.takenCount))}</span>
          </button>)}
          <RemoteOptionFooter remote={people.remote} />
        </section> : null}
        {teams.isPending || people.isPending ? <p role="status" className="px-5 py-3 text-[15px] text-[var(--t2)]">{t("common:states.loading")}</p> : null}
        {empty ? <p className="px-5 py-3 text-[15px] text-[var(--t2)]">{t("chats.transfer.empty")}</p> : null}
      </div>
    </DialogContent>
  </Dialog>;
}
