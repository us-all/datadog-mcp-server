import { z } from "zod/v4";
import { monitorsApi, eventsApi, downtimesApi } from "../client.js";
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
