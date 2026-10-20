import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { DeleteIcon, EditIcon, WhatsAppIcon } from "@/shared/ui/icons";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import type { WhatsAppTeamResponse } from "../../api/types";
import { deleteTeam, fetchTeams, teamsQueryKey, teamsQueryRoot, type TeamScope, type TeamsQuery } from "../api/teams";
import { createTeamColumns, teamPhoneRow } from "../columns";
import { TeamDialog } from "../components/TeamDialog";

const noFilters = [] as const;

type Editing = { team?: WhatsAppTeamResponse; returnFocusTo?: HTMLElement | null };

/// Tableros WA-Equipos y Plat-WA-Equipos (y sus M-*): la lista de equipos con cuántos son y el aviso por correo,
/// «Crear equipo» en la banda (el «+» en el teléfono) y, en el ⋮ de cada uno, editarlo o borrarlo.
function TeamsPage({ scope }: { scope: TeamScope }) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<{ team: WhatsAppTeamResponse; returnFocusTo: HTMLElement | null } | null>(null);
  const { result: teams, paginationProps } = usePagedQuery({
    filterKeys: noFilters,
    toQuery: ({ page, pageSize, search }): TeamsQuery => ({ page, pageSize, search }),
    queryKey: (query) => teamsQueryKey(scope, query), queryFn: (query) => fetchTeams(scope, query), meta: { silent: true, blocksView: true },
  });
  const remove = useMutation({
    mutationFn: (team: WhatsAppTeamResponse) => deleteTeam(scope, team.id, team.version),
    onSuccess: async (_result, team) => {
      setDeleting(null);
      toast.success(t("whatsapp:teams.messages.deleted", { name: team.name }));
      await queryClient.invalidateQueries({ queryKey: teamsQueryRoot(scope) });
    },
    onError: (error) => toastActionError(error, t),
  });

  const rowActions = (team: WhatsAppTeamResponse) => <RowActions label={t("whatsapp:teams.rowActions", { name: team.name })} title={team.name} actions={[
    { label: t("whatsapp:teams.edit"), accessibleName: t("whatsapp:teams.edit"), icon: EditIcon, onSelect: (trigger) => setEditing({ team, returnFocusTo: trigger }) },
    { label: t("whatsapp:teams.delete"), accessibleName: t("whatsapp:teams.delete"), icon: DeleteIcon, destructive: true, onSelect: (trigger) => setDeleting({ team, returnFocusTo: trigger }) },
  ]} />;
  const columns: Column<WhatsAppTeamResponse>[] = [
    ...createTeamColumns(t, scope),
    { id: "actions", header: t("whatsapp:teams.columns.actions"), type: "actions", cell: rowActions },
  ];
  const create = () => setEditing({});

  return <>
    <Page icon={WhatsAppIcon} title={t("whatsapp:teams.title")} phoneBody="flush"
      summary={teams.data ? t("whatsapp:teams.summary", { count: teams.data.totalCount }) : undefined}
      fab={{ label: t("whatsapp:teams.create"), onClick: create }}
      actions={<Button type="button" onClick={create}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("whatsapp:teams.create")}</Button>}>
      <Surface className="overflow-hidden" phoneFlush>
        <DataTable columns={columns} rows={teams.data?.items ?? []} rowKey={(team) => team.id}
          mobileRow={(team) => teamPhoneRow(team, scope, t, rowActions(team))}
          isLoading={teams.isPending} isFetching={teams.isFetching}
          error={teams.error ? apiErrorMessage(teams.error, t) : undefined} onRetry={() => { void teams.refetch(); }}
          emptyTitle={t("whatsapp:teams.empty")} />
        {paginationProps ? <Pagination {...paginationProps} /> : null}
      </Surface>
    </Page>
    {editing ? <TeamDialog scope={scope} team={editing.team} returnFocusTo={editing.returnFocusTo} onClose={() => setEditing(null)} /> : null}
    <ConfirmDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}
      title={t("whatsapp:teams.confirmDelete", { name: deleting?.team.name ?? "" })} confirmLabel={t("whatsapp:teams.delete")} destructive
      returnFocusTo={deleting?.returnFocusTo} onConfirm={() => { if (deleting) remove.mutate(deleting.team); }} />
  </>;
}

export function OrganizationTeamsPage() {
  return <TeamsPage scope="organization" />;
}

export function PlatformTeamsPage() {
  return <TeamsPage scope="platform" />;
}
