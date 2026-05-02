import { z } from "zod/v4";
import { slosApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

export const listSlosSchema = z.object({
  ids: z.string().optional().describe("Comma-separated list of SLO IDs to filter. Example: abc123,def456"),
  query: z.string().optional().describe("Search query for SLO names. Example: api-latency"),
  tagsQuery: z.string().optional().describe("Filter by tags. Example: env:prod,team:backend"),
  limit: z.coerce.number().optional().default(100).describe("Max results (default 100)"),
  offset: z.coerce.number().optional().default(0).describe("Pagination offset"),
});

export async function listSlos(params: z.infer<typeof listSlosSchema>) {
  const response = await slosApi.listSLOs({
    ids: params.ids,
    query: params.query,
    tagsQuery: params.tagsQuery,
    limit: params.limit,
    offset: params.offset,
  });

  const slos = response.data ?? [];
  return {
    count: slos.length,
    slos: slos.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      type: s.type,
      tags: s.tags,
      thresholds: s.thresholds,
      targetThreshold: s.targetThreshold,
      warningThreshold: s.warningThreshold,
      monitorIds: s.monitorIds,
      created: s.createdAt,
      modified: s.modifiedAt,
      creator: s.creator,
    })),
  };
}

export const getSloSchema = z.object({
  sloId: z.string().describe("SLO ID. Example: abc123def456abc123def456abc123de"),
});

export async function getSlo(params: z.infer<typeof getSloSchema>) {
  const response = await slosApi.getSLO({
    sloId: params.sloId,
  });

  const s = response.data;
  return {
    id: s?.id,
    name: s?.name,
    description: s?.description,
    type: s?.type,
    tags: s?.tags,
    thresholds: s?.thresholds,
    targetThreshold: s?.targetThreshold,
    warningThreshold: s?.warningThreshold,
    monitorIds: s?.monitorIds,
    groups: s?.groups,
    query: s?.query,
    created: s?.createdAt,
    modified: s?.modifiedAt,
    creator: s?.creator,
  };
}

const sloThresholdSchema = z.object({
  target: z.coerce.number().describe("Target SLI value (e.g. 99.9)"),
  timeframe: z.enum(["7d", "30d", "90d"]).describe("SLO time window"),
  warning: z.coerce.number().optional().describe("Optional warning threshold (must be > target)"),
});

export const createSloSchema = z.object({
  name: z.string().describe("SLO name"),
  type: z.enum(["monitor", "metric", "time_slice"]).describe("SLO type. 'monitor' uses linked monitors; 'metric' uses a numerator/denominator query; 'time_slice' uses time-slice SLI"),
  thresholds: z.array(sloThresholdSchema).min(1).describe("One or more {target, timeframe, warning?} entries"),
  description: z.string().optional().describe("SLO description"),
  monitorIds: z.array(z.coerce.number()).optional().describe("Required if type='monitor'. List of linked monitor IDs"),
  query: z.object({
    numerator: z.string().describe("Numerator metric query"),
    denominator: z.string().describe("Denominator metric query"),
  }).optional().describe("Required if type='metric'"),
  tags: z.array(z.string()).optional().describe("Tags. Example: ['env:prod', 'team:backend']"),
  targetThreshold: z.coerce.number().optional().describe("Convenience: target % (e.g. 99.9)"),
  warningThreshold: z.coerce.number().optional().describe("Convenience: warning %"),
});

export async function createSlo(params: z.infer<typeof createSloSchema>) {
  assertWriteAllowed();
  const response = await slosApi.createSLO({
    body: {
      name: params.name,
      type: params.type as never,
      thresholds: params.thresholds.map((t) => ({
        target: t.target,
        timeframe: t.timeframe as never,
        ...(t.warning !== undefined ? { warning: t.warning } : {}),
      })),
      description: params.description,
      monitorIds: params.monitorIds,
      query: params.query,
      tags: params.tags,
      targetThreshold: params.targetThreshold,
      warningThreshold: params.warningThreshold,
    },
  });
  const created = response.data?.[0];
  return {
    id: created?.id,
    name: created?.name,
    type: created?.type,
    monitorIds: created?.monitorIds,
    thresholds: created?.thresholds,
    targetThreshold: created?.targetThreshold,
    warningThreshold: created?.warningThreshold,
    tags: created?.tags,
    created: created?.createdAt,
  };
}

export const updateSloSchema = z.object({
  sloId: z.string().describe("SLO ID to update"),
  name: z.string().optional().describe("New SLO name (unchanged if omitted)"),
  description: z.string().optional().describe("New description (unchanged if omitted)"),
  thresholds: z.array(sloThresholdSchema).optional().describe("Replace thresholds (unchanged if omitted)"),
  monitorIds: z.array(z.coerce.number()).optional().describe("Replace linked monitor IDs (monitor-type SLOs only)"),
  tags: z.array(z.string()).optional().describe("Replace tags (unchanged if omitted)"),
});

export async function updateSlo(params: z.infer<typeof updateSloSchema>) {
  assertWriteAllowed();
  // Fetch current state to merge — Datadog updateSLO requires the full object.
  const current = await slosApi.getSLO({ sloId: params.sloId });
  const s = current.data;
  if (!s) throw new Error(`SLO ${params.sloId} not found`);
  const response = await slosApi.updateSLO({
    sloId: params.sloId,
    body: {
      name: params.name ?? s.name ?? "",
      type: s.type as never,
      thresholds: params.thresholds
        ? params.thresholds.map((t) => ({
            target: t.target,
            timeframe: t.timeframe as never,
            ...(t.warning !== undefined ? { warning: t.warning } : {}),
          }))
        : (s.thresholds ?? []),
      description: params.description ?? s.description ?? undefined,
      monitorIds: params.monitorIds ?? s.monitorIds,
      query: s.query,
      tags: params.tags ?? s.tags,
      targetThreshold: s.targetThreshold,
      warningThreshold: s.warningThreshold,
    },
  });
  const updated = response.data?.[0];
  return { id: updated?.id, name: updated?.name, modified: updated?.modifiedAt };
}

export const deleteSloSchema = z.object({
  sloId: z.string().describe("SLO ID to delete"),
  force: z.string().optional().describe("'true' to force delete even if linked dashboards exist"),
});

export async function deleteSlo(params: z.infer<typeof deleteSloSchema>) {
  assertWriteAllowed();
  const response = await slosApi.deleteSLO({
    sloId: params.sloId,
    force: params.force,
  });
  return { deletedIds: response.data ?? [], errors: response.errors };
}

export const getSloHistorySchema = z.object({
  sloId: z.string().describe("SLO ID. Example: abc123def456abc123def456abc123de"),
  fromTs: z.coerce.number().describe("Start time as Unix epoch seconds. Example: 1740000000"),
  toTs: z.coerce.number().describe("End time as Unix epoch seconds. Example: 1740086400"),
  target: z.coerce.number().optional().describe("Target SLO value. Example: 99.9"),
});

export async function getSloHistory(params: z.infer<typeof getSloHistorySchema>) {
  const response = await slosApi.getSLOHistory({
    sloId: params.sloId,
    fromTs: params.fromTs,
    toTs: params.toTs,
    target: params.target,
  });

  return {
    thresholds: response.data?.thresholds,
    overall: response.data?.overall,
    series: response.data?.series,
    errors: response.errors,
  };
}
