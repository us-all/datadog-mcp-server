import { z } from "zod/v4";
import { monitorsApi, eventsApi, downtimesApi, slosApi, sloCorrectionsApi } from "../client.js";
import { extractFieldsDescription } from "./extract-fields.js";

const ef = z.string().optional().describe(extractFieldsDescription);

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

  const [monitorR, eventsR, downtimesR] = await Promise.allSettled([
    monitorsApi.getMonitor({ monitorId, groupStates: "all" }),
    eventsApi.listEvents({ start: since, end: now, tags: `monitor:${monitorId}` }).catch(() => null),
    includeDowntimes
      ? downtimesApi.listDowntimes({ currentOnly: true })
      : Promise.resolve(null),
  ]);

  const monitor = monitorR.status === "fulfilled" ? monitorR.value : null;
  const allEvents = eventsR.status === "fulfilled" && eventsR.value ? eventsR.value : null;
  const allDowntimes = downtimesR.status === "fulfilled" && downtimesR.value ? downtimesR.value : null;

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
      monitorState: (monitor as { overallState?: string } | null)?.overallState ?? "unknown",
      monitorType: (monitor as { type?: string } | null)?.type ?? null,
      eventsHoursBack: hoursBack,
      eventsCount: Array.isArray((allEvents as { events?: unknown[] } | null)?.events)
        ? (allEvents as { events: unknown[] }).events.length
        : 0,
      activeDowntimesCount: downtimes?.length ?? 0,
    },
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

  const [sloR, historyR, correctionsR] = await Promise.allSettled([
    slosApi.getSLO({ sloId }),
    slosApi.getSLOHistory({ sloId, fromTs, toTs }),
    // list-slo-corrections has no server-side SLO filter; fetch a page and filter client-side.
    sloCorrectionsApi.listSLOCorrection({ limit: 1000 }),
  ]);

  if (sloR.status === "rejected") {
    caveats.push(`get-slo failed: ${reasonMessage(sloR.reason)}`);
  }
  if (historyR.status === "rejected") {
    caveats.push(`get-slo-history failed: ${reasonMessage(historyR.reason)}`);
  }
  if (correctionsR.status === "rejected") {
    caveats.push(`list-slo-corrections failed: ${reasonMessage(correctionsR.reason)}`);
  }

  const sloData = sloR.status === "fulfilled" ? sloR.value.data : null;
  const historyData = historyR.status === "fulfilled" ? historyR.value.data : null;
  const correctionsAll = correctionsR.status === "fulfilled" ? (correctionsR.value.data ?? []) : [];

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
