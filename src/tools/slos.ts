import { z } from "zod/v4";
import { slosApi } from "../client.js";

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
