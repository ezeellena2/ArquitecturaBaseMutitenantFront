import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { organizationAuditCategories as auditCategories } from "@/shared/api/generated/validation";
import { ClipboardIcon } from "@/shared/ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCursorList } from "@/shared/hooks/useCursorList";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFilters } from "@/shared/hooks/useFilters";
import { useQueryUpdate } from "@/shared/hooks/useQueryUpdate";
import { usePagination } from "@/shared/hooks/usePagination";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { Column } from "@/shared/ui/DataTable";
import { DataTable } from "@/shared/ui/DataTable";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { DetailGrid } from "@/shared/ui/DetailGrid";
import { FilterBar } from "@/shared/ui/FilterBar";
import { LoadMore } from "@/shared/ui/LoadMore";
import { Page } from "@/shared/ui/Page";
import { ListRow } from "@/shared/ui/app/ListRow";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Surface } from "@/shared/ui/Surface";
import { DateText } from "@/shared/ui/format/DateText";
import type { OrganizationAuditEntryResponse } from "@/shared/api/types";
import { auditActorKinds, auditQueryRoot, fetchAudit, auditActorOptions } from "../api/audit";

const auditFilterKeys = ["period", "category", "actorId", "actorKind"] as const;


export function AuditPage() {
  const { t } = useTranslation(["audit", "common"]);
  const filters = useFilters(auditFilterKeys);
  // Por cursor («Cargar más», sin páginas ni total): de usePagination solo usa la búsqueda en la URL.
  const pagination = usePagination();
  const search = useDebouncedValue(pagination.search ?? "");
  const period = filters.values.period ?? "30";
  const category = filters.values.category;
  const actorId = filters.values.actorId;
  const actorKind = auditActorKinds.find((kind) => kind === filters.values.actorKind);
  const baseQuery = { period, category, actorId, actorKind, search: search || undefined };
  const updateQuery = useQueryUpdate();

  // De a 25, con «Cargar más»; los filtros van en la clave y el cursor, solo en la consulta.
  const audit = useCursorList([...auditQueryRoot, baseQuery],
    (after) => fetchAudit({ ...baseQuery, after: after ?? undefined, limit: 25 }),
    { meta: { silent: true, blocksView: true } });
  const actors = useResourceOptions(auditActorOptions({ period, category, search: search || undefined }));
  const [selected, setSelected] = useState<OrganizationAuditEntryResponse | null>(null);
  const { phone } = useAppChrome();

  const columns: Column<OrganizationAuditEntryResponse>[] = [
    { id: "occurredAtUtc", header: t("audit:columns.when"), type: "custom", mobile: "status", className: "w-[162px] max-md:w-[25%]", cell: (row) => <div className="whitespace-normal text-left"><DateText value={row.occurredAtUtc} kind="dateTime" className="whitespace-normal" /></div> },
    {
      id: "action", header: t("audit:columns.action"), type: "custom", mobile: "primary",
      // Tablero Auditoria-Org: tocar «Qué pasó» abre el detalle; sin el ojo.
      cell: (row) => <button type="button" aria-label={t("audit:openDetails", { action: row.actionText })}
        className="block w-full truncate text-left text-[var(--t1)] hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]"
        onClick={() => setSelected(row)}>{row.actionText}</button>,
    },
    // Columnas del tablero: 140px, 2.4fr, 1.4fr y 1.2fr, más los márgenes de cada celda; «Qué pasó» se lleva el resto. Con
    // «Quién» en el 21 %, «Dónde» y «Quién» arrancan donde el tablero (1013 y 1227 a 1440).
    { id: "where", header: t("audit:columns.where"), type: "text", className: "w-[23%]", value: (row) => row.whereText },
    { id: "actor", header: t("audit:columns.who"), type: "text", className: "w-[21%]", value: (row) => row.actorDisplayName ?? row.actorText },
  ];
  const periodValue = period;
  // Como el tablero: cualquier filtro distinto de «Últimos 30 días» sin búsqueda ni tema ni persona cuenta.
  const filtered = Boolean(category || actorId || actorKind || pagination.search || filters.values.period && period !== "30");
  return <>
    {/* Tablero M-Auditoria-Org y lienzo v99: en el teléfono, debajo del título va el camino («Administración»), como en
        toda pantalla interna; el período elegido se ve en el filtro. */}
    <Page icon={ClipboardIcon} title={t("audit:title")} phoneBody="flush">
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar phoneTools="filter"
          label={t("audit:filters.label")}
          searchLabel={t("audit:filters.search")}
          searchValue={pagination.search ?? ""}
          onSearchChange={pagination.setSearch}
          filters={[
            {
              key: "period", label: t("audit:filters.period"), menuLabel: t("audit:filters.periodMenu"),
              value: periodValue, active: filters.values.period !== undefined && periodValue !== "30",
              onChange: (value) => filters.setFilter("period", value === "30" ? undefined : value),
              options: [
                { value: "0", label: t("audit:period.today") },
                { value: "7", label: t("audit:period.days7") },
                { value: "30", label: t("audit:period.days30") },
                { value: "all", label: t("audit:period.all") },
              ],
            },
            {
              key: "category", label: t("audit:filters.category"), menuLabel: t("audit:filters.categoryMenu"),
              // Sin filtro el botón dice «Tema: todos» y el menú ofrece «Todos», como el tablero.
              value: category ?? "", active: category !== undefined,
              onChange: (value) => filters.setFilter("category", value === "all" ? undefined : value),
              options: [{ value: "all", label: t("audit:filters.allCategories") }, ...auditCategories.map((value) => ({ value, label: t(`audit:categories.${value}`) }))],
            },
            {
              // Tablero Auditoria-Org: las personas, «Sistema» y «Plataforma», en el orden del back. Una persona va por su id;
              // el sistema y la plataforma, que no tienen, por su tipo. Los dos viajan en un solo cambio de la URL.
              key: "actor", label: t("audit:filters.actor"), menuLabel: t("audit:filters.actorMenu"), remote: actors.remote, selectedLabel: actors.knownItems.find((actor) => (actor.actorId ?? actor.actorKind) === (actorId ?? actorKind))?.displayName ?? actors.knownItems.find((actor) => (actor.actorId ?? actor.actorKind) === (actorId ?? actorKind))?.actorText,
              value: actorKind ?? actorId ?? "", active: actorId !== undefined || actorKind !== undefined,
              onChange: (value) => {
                const kind = auditActorKinds.find((item) => item === value);
                updateQuery({ actorId: value === "all" || kind ? undefined : value, actorKind: kind, page: undefined });
              },
              options: [{ value: "all", label: t("audit:filters.allActors") }, ...actors.items.flatMap((actor) => {
                const value = actor.actorId ?? auditActorKinds.find((kind) => kind === actor.actorKind);
                return value ? [{ value, label: actor.displayName ?? actor.actorText }] : [];
              })],
            },
          ]}
          clearLabel={t("common:actions.clear")}
          onClear={filters.clear}
        />
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable
            columns={columns}
            // Tablero M-Auditoria-Org: qué pasó (en dos renglones si hace falta), cuándo a la derecha (la fecha corta, sin el año
            // si es del año en curso), y dónde y quién abajo.
            mobileRow={(row) => <ListRow key={row.id} wrapTitle title={row.actionText} onClick={() => setSelected(row)}
              meta={<DateText value={row.occurredAtUtc} kind="shortDateTime" />}
              lines={[[row.whereText, row.actorDisplayName ?? row.actorText].filter(Boolean).join(" · ")]} />}
            rows={audit.items}
            rowKey={(row) => row.id}
            isLoading={audit.isPending}
            isFetching={audit.isFetching}
            error={audit.error ? apiErrorMessage(audit.error, t) : undefined}
            onRetry={() => { void audit.refetch(); }}
            emptyTitle={filtered ? t("audit:emptyFiltered") : t("audit:empty")}
            emptyAction={filtered ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined}
          />
          <LoadMore hasMore={audit.hasNextPage} isLoading={audit.isFetchingNextPage} onLoadMore={() => { void audit.fetchNextPage(); }} />
        </Surface>
      </div>
    </Page>
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      {/* «Criterio · Diálogos»: el diálogo normal, de 560, como Auditoria-Org. Qué pasó; Quién (nombre · correo), Dónde y
          cada cambio «antes → después». En el teléfono, la hoja de M-Auditoria-Org (`DetailGrid`). */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selected?.actionText ?? t("audit:details")}</DialogTitle>
        </DialogHeader>
        {selected ? <DetailGrid phone={phone} items={[
          ...(phone ? [{ key: "when", label: t("audit:columns.when"), value: <DateText value={selected.occurredAtUtc} kind="dateTime" /> }] : []),
          { key: "who", label: t("audit:columns.who"), value: phone
            ? <>{selected.actorDisplayName ?? selected.actorText}{selected.actorEmail ? <span className="block break-words text-[14px] font-normal text-[var(--t2)]">{selected.actorEmail}</span> : null}</>
            : [selected.actorDisplayName ?? selected.actorText, selected.actorEmail].filter(Boolean).join(" · ") },
          { key: "where", label: t("audit:columns.where"), value: selected.whereText },
          ...selected.changes.map((change) => ({ key: `change:${change.field}`, label: change.field,
            value: <>{change.oldValue ? <><span className="text-[var(--t3)] line-through">{change.oldValue}</span>{" → "}</> : null}{change.newValue ?? t("audit:noValue")}</> })),
        ]} /> : null}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  </>;
}
