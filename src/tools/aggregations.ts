import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { aggregate } from "@us-all/mcp-toolkit";
import { monitorsApi, eventsApi, downtimesApi, slosApi, sloCorrectionsApi, incidentsApi, logsApi } from "../client.js";
import { applyExtractFields, extractFieldsDescription } from "./extract-fields.js";

const ef = z.string().optional().describe(extractFieldsDescription);

// Match get-monitor's slim default projection so the embedded `monitor`
// in analyze-monitor-state has the same shape as a direct get-monitor call.
const SLIM_MONITOR_FIELDS = "id,name,type,overallState,tags,query";

/**
 * Aggregation tools — round-trip elimination.
 *
 * Without aggregation, an LLM investigating a monitor typically needs:
 *   1. get-monitor             → config + current state
 *   2. get-events              → recent triggered alerts
 *   3. list-downtimes          → active downtimes for the monitor
 *
 * `analyze-monitor-state` consolidates these into one response.
 *
 * `slo-compliance-snapshot` does the same for SLOs:
 *   1. get-slo                 → config (target, thresholds, monitor IDs, type)
 *   2. get-slo-history         → SLI value + status over historyDays window
 *   3. list-slo-corrections    → active/recent corrections (filtered client-side)
 *   4. get-monitor (each)      → current overall state per linked monitor
 */

export const analyzeMonitorStateSchema = z.object({
  monitorId: z.coerce.number().describe("Monitor ID"),
  hoursBack: z.coerce.number().optional().default(24).describe("Hours to look back for triggered events (default 24)"),
  includeDowntimes: z.boolean().optional().default(true).describe("Include active downtimes for this monitor (default true)"),
  extractFields: ef,
});

export async function analyzeMonitorState(params: z.infer<typeof analyzeMonitorStateSchema>) {
  const { monitorId, hoursBack, includeDowntimes } = params;

  const now = Math.floor(Date.now() / 1000);
  const since = now - hoursBack * 3600;

  const caveats: string[] = [];

  const { getMonitor: monitorRaw, listEvents: allEvents, listDowntimes: allDowntimes } = await aggregate(
    {
      getMonitor: () => monitorsApi.getMonitor({ monitorId, groupStates: "all" }),
      listEvents: () => eventsApi.listEvents({ start: since, end: now, tags: `monitor:${monitorId}` }),
      listDowntimes: includeDowntimes
        ? () => downtimesApi.listDowntimes({ currentOnly: true })
        : () => Promise.resolve(null),
    },
    caveats,
  );

  // Capture overallState/type from raw monitor before slimming for the summary block.
  const monitorState = (monitorRaw as { overallState?: string } | null)?.overallState ?? "unknown";
  const monitorType = (monitorRaw as { type?: string } | null)?.type ?? null;
  // Slim the embedded monitor so analyze-monitor-state and get-monitor agree on shape.
  // Caller can pass extractFields="*" to keep full payload (wrapToolHandler then projects).
  const monitor = monitorRaw ? applyExtractFields(monitorRaw, SLIM_MONITOR_FIELDS) : null;

  // Filter downtimes to those scoped to this monitor
  const downtimes = allDowntimes && Array.isArray((allDowntimes as { data?: unknown[] }).data)
    ? (allDowntimes as { data: Array<{ attributes?: { monitorIdentifier?: { type?: string; monitorId?: number } } }> }).data.filter(
        (dt) => dt.attributes?.monitorIdentifier?.type === "monitor_id" && dt.attributes.monitorIdentifier.monitorId === monitorId,
      )
    : null;

  return {
    monitor,
    recentEvents: allEvents,
    activeDowntimes: downtimes,
    summary: {
      monitorState,
      monitorType,
      eventsHoursBack: hoursBack,
      eventsCount: Array.isArray((allEvents as { events?: unknown[] } | null)?.events)
        ? (allEvents as { events: unknown[] }).events.length
        : 0,
      activeDowntimesCount: downtimes?.length ?? 0,
    },
    caveats,
  };
}

// --- slo-compliance-snapshot ---

export const sloComplianceSnapshotSchema = z.object({
  sloId: z.string().describe("SLO ID. Example: abc123def456abc123def456abc123de"),
  historyDays: z.coerce.number().int().min(1).max(90).optional().describe("Days of history to evaluate SLI against target (default 7, max 90)"),
  extractFields: ef,
});

export async function sloComplianceSnapshot(params: z.infer<typeof sloComplianceSnapshotSchema>) {
  const { sloId } = params;
  const historyDays = params.historyDays ?? 7;

  const caveats: string[] = [];

  const now = Math.floor(Date.now() / 1000);
  const fromTs = now - historyDays * 86400;
  const toTs = now;

  const { getSlo, getSloHistory, listCorrections } = await aggregate(
    {
      getSlo: () => slosApi.getSLO({ sloId }),
      getSloHistory: () => slosApi.getSLOHistory({ sloId, fromTs, toTs }),
      // list-slo-corrections has no server-side SLO filter; fetch a page and filter client-side.
      listCorrections: () => sloCorrectionsApi.listSLOCorrection({ limit: 1000 }),
    },
    caveats,
  );

  const sloData = getSlo?.data ?? null;
  const historyData = getSloHistory?.data ?? null;
  const correctionsAll = listCorrections?.data ?? [];

  const monitorIds: number[] = Array.isArray(sloData?.monitorIds) ? (sloData!.monitorIds as number[]) : [];

  // Fetch each linked monitor's current overall state in parallel.
  const monitorResults = monitorIds.length
    ? await Promise.allSettled(
        monitorIds.map((id) => monitorsApi.getMonitor({ monitorId: id })),
      )
    : [];

  const monitors = monitorResults.map((r, i) => {
    if (r.status === "fulfilled") {
      const m = r.value;
      return { id: m.id ?? monitorIds[i], name: m.name, overallState: m.overallState };
    }
    caveats.push(`get-monitor ${monitorIds[i]} failed: ${reasonMessage(r.reason)}`);
    return { id: monitorIds[i], name: null, overallState: "unknown" as const };
  });

  // Filter corrections to this SLO.
  const corrections = correctionsAll
    .filter((c) => c.attributes?.sloId === sloId)
    .map((c) => ({
      id: c.id,
      category: c.attributes?.category,
      description: c.attributes?.description,
      start: c.attributes?.start,
      end: c.attributes?.end,
      duration: c.attributes?.duration,
      rrule: c.attributes?.rrule,
    }));

  // Compute error budget + status.
  // target is in % (e.g. 99.9). sliValue is in % (e.g. 99.95).
  // errorBudgetRemainingPct = (sliValue - target) / (100 - target) * 100
  //   - 100% means full budget remaining (sliValue == 100)
  //   - 0% means budget exactly consumed (sliValue == target)
  //   - <0% means breached
  const target = typeof sloData?.targetThreshold === "number" ? sloData.targetThreshold : null;
  const sliValue = typeof historyData?.overall?.sliValue === "number" ? historyData.overall.sliValue : null;

  let errorBudgetRemainingPct: number | null = null;
  let status: "compliant" | "at-risk" | "breached" | "unknown" = "unknown";

  if (target !== null && sliValue !== null && target < 100) {
    errorBudgetRemainingPct = ((sliValue - target) / (100 - target)) * 100;
    if (errorBudgetRemainingPct < 0) status = "breached";
    else if (errorBudgetRemainingPct < 50) status = "at-risk";
    else status = "compliant";
  }

  return {
    slo: {
      id: sloData?.id ?? sloId,
      name: sloData?.name ?? null,
      type: sloData?.type ?? null,
      target,
      thresholds: sloData?.thresholds ?? null,
      monitorIds,
    },
    history: {
      from: fromTs,
      to: toTs,
      sliValue,
      status: (historyData?.overall as { status?: number } | undefined)?.status ?? null,
    },
    corrections,
    monitors,
    errorBudgetRemainingPct,
    status,
    caveats,
  };
}

function reasonMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return "unknown error";
  }
}

// --- incident-triage-snapshot ---

export const incidentTriageSnapshotSchema = z.object({
  incidentId: z.string().describe("Incident ID. Use list-incidents or search-incidents to find one."),
  lookbackMinutes: z.coerce.number().int().min(5).max(720).optional().default(60)
    .describe("Minutes before incident creation to scan for related signals (default 60, max 720)"),
  service: z.string().optional()
    .describe("Override the service tag scan. By default, derived from incident.fields.services[0]."),
  includeLogSpike: z.boolean().optional().default(true)
    .describe("Run an aggregate-logs spike detection over the window for the incident's service"),
  includeSimilar: z.boolean().optional().default(true)
    .describe("Search for incidents on the same service in the last 14 days"),
  extractFields: ef,
});

interface IncidentAttrs {
  title?: string;
  customerImpacted?: boolean;
  customerImpactScope?: string;
  fields?: Record<string, { value?: string | number | string[]; type?: string }>;
  severity?: string;
  state?: string;
  created?: string | Date;
  resolved?: string | Date | null;
}

function readField(fields: IncidentAttrs["fields"], key: string): string | string[] | null {
  const f = fields?.[key];
  if (!f) return null;
  const v = f.value;
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string" || typeof v === "number") return String(v);
  return null;
}

function firstString(v: string | string[] | null): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

export async function incidentTriageSnapshot(params: z.infer<typeof incidentTriageSnapshotSchema>) {
  const { incidentId, lookbackMinutes, includeLogSpike, includeSimilar } = params;

  const caveats: string[] = [];

  const incidentResp = await incidentsApi
    .getIncident({ incidentId })
    .catch((err: unknown) => {
      caveats.push(`get-incident failed: ${reasonMessage(err)}`);
      return null;
    });

  const data = incidentResp?.data;
  const attrs = (data?.attributes ?? {}) as IncidentAttrs;
  const fields = attrs.fields ?? {};

  const service = params.service ?? firstString(readField(fields, "services"));
  const team = firstString(readField(fields, "teams"));

  const createdMs = attrs.created ? new Date(attrs.created).getTime() : Date.now();
  const resolvedMs = attrs.resolved ? new Date(attrs.resolved).getTime() : null;

  const fromMs = createdMs - lookbackMinutes * 60_000;
  const toMs = resolvedMs ?? Date.now();

  const fromSec = Math.floor(fromMs / 1000);
  const toSec = Math.floor(toMs / 1000);
  const fromIso = new Date(fromMs).toISOString();
  const toIso = new Date(toMs).toISOString();

  // Tag filter for events: prefer service, fall back to team.
  const eventTagFilter = service ? `service:${service}` : team ? `team:${team}` : undefined;

  const since14d = Math.floor(Date.now() / 1000) - 14 * 86400;

  const { listEvents, similar, logSpike } = await aggregate(
    {
      listEvents: () =>
        eventsApi.listEvents({ start: fromSec, end: toSec, tags: eventTagFilter }),
      similar: includeSimilar && service
        ? () =>
            incidentsApi.searchIncidents({
              query: `services:${service}`,
              pageSize: 10,
              sort: "-created" as v2.IncidentSearchSortOrder,
            })
        : () => Promise.resolve(null),
      logSpike: includeLogSpike && service
        ? () => {
            const compute = new v2.LogsCompute();
            compute.aggregation = "count" as v2.LogsAggregationFunction;
            compute.type = "total" as v2.LogsComputeType;
            const filter = new v2.LogsQueryFilter();
            filter.query = `service:${service} status:error`;
            filter.from = fromIso;
            filter.to = toIso;
            const body = new v2.LogsAggregateRequest();
            body.compute = [compute];
            body.filter = filter;
            const groupBy = new v2.LogsGroupBy();
            groupBy.facet = "@timestamp";
            groupBy.limit = 50;
            body.groupBy = [groupBy];
            return logsApi.aggregateLogs({ body });
          }
        : () => Promise.resolve(null),
    },
    caveats,
  );

  // Drop the noise from the incident's heavy `fields` blob; surface only what
  // a triage view needs. Caller can pass extractFields="*" to keep everything.
  const incident = data
    ? {
        id: data.id,
        title: attrs.title ?? null,
        severity: firstString(readField(fields, "severity")) ?? attrs.severity ?? null,
        state: firstString(readField(fields, "state")) ?? attrs.state ?? null,
        customerImpacted: attrs.customerImpacted ?? null,
        customerImpactScope: attrs.customerImpactScope ?? null,
        services: readField(fields, "services") ?? null,
        teams: readField(fields, "teams") ?? null,
        created: attrs.created ?? null,
        resolved: attrs.resolved ?? null,
      }
    : null;

  // Trim similar incidents to the high-signal fields and exclude the current one.
  const similarRaw = (similar as { data?: Array<{ id?: string; attributes?: IncidentAttrs }> } | null)?.data ?? [];
  const similarIncidents = similarRaw
    .filter((i) => i.id !== incidentId)
    .filter((i) => {
      // 14d window — datadog search doesn't always honor age, filter client-side.
      const c = i.attributes?.created ? new Date(i.attributes.created).getTime() : 0;
      return c / 1000 >= since14d;
    })
    .slice(0, 5)
    .map((i) => ({
      id: i.id,
      title: i.attributes?.title ?? null,
      created: i.attributes?.created ?? null,
      resolved: i.attributes?.resolved ?? null,
      severity: firstString(readField(i.attributes?.fields, "severity")) ?? null,
    }));

  // Distill the log-spike response into pass/fail + peak.
  const buckets = (logSpike as { data?: { buckets?: Array<{ computes?: Record<string, number>; by?: Record<string, string> }> } } | null)?.data?.buckets ?? [];
  const peak = buckets.reduce<{ ts?: string; count: number }>(
    (acc, b) => {
      const c = Number(b.computes?.c0 ?? b.computes?.["count"] ?? 0);
      return c > acc.count ? { ts: b.by?.["@timestamp"], count: c } : acc;
    },
    { count: 0 },
  );
  const total = buckets.reduce((sum, b) => sum + Number(b.computes?.c0 ?? b.computes?.["count"] ?? 0), 0);
  const avg = buckets.length ? total / buckets.length : 0;
  // Heuristic spike: peak >= 3× the average and >= 5 errors in the window.
  const hasSpike = peak.count >= 5 && avg > 0 && peak.count >= avg * 3;

  const eventsArray = (listEvents as { events?: unknown[] } | null)?.events ?? [];

  const durationMin = resolvedMs ? Math.round((resolvedMs - createdMs) / 60_000) : null;

  return {
    incident,
    window: { fromTs: fromSec, toTs: toSec, lookbackMinutes },
    serviceUnderTriage: service,
    events: eventsArray,
    similarIncidents,
    logSpike: includeLogSpike && service
      ? { service, hasSpike, peakCount: peak.count, peakTs: peak.ts ?? null, totalErrors: total, bucketCount: buckets.length }
      : null,
    summary: {
      severity: incident?.severity,
      state: incident?.state,
      durationMin,
      eventsCount: eventsArray.length,
      similarCount: similarIncidents.length,
      logSpikeDetected: hasSpike,
      service,
    },
    caveats,
  };
}
