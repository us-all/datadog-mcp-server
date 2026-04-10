import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { rumRetentionFiltersApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

const eventTypeEnum = z.enum(["session", "view", "action", "error", "resource", "long_task", "vital"]);

// --- List Retention Filters ---

export const listRumRetentionFiltersSchema = z.object({
  appId: z.string().describe("RUM application ID"),
});

export async function listRumRetentionFilters(params: z.infer<typeof listRumRetentionFiltersSchema>) {
  const response = await rumRetentionFiltersApi.listRetentionFilters({ appId: params.appId });
  const filters = response.data ?? [];
  return {
    count: filters.length,
    filters: filters.map((f) => ({
      id: f.id,
      type: f.type,
      name: f.attributes?.name,
      enabled: f.attributes?.enabled,
      eventType: f.attributes?.eventType,
      query: f.attributes?.query,
      sampleRate: f.attributes?.sampleRate,
    })),
  };
}

// --- Get Retention Filter ---

export const getRumRetentionFilterSchema = z.object({
  appId: z.string().describe("RUM application ID"),
  filterId: z.string().describe("Retention filter ID (UUID)"),
});

export async function getRumRetentionFilter(params: z.infer<typeof getRumRetentionFilterSchema>) {
  const response = await rumRetentionFiltersApi.getRetentionFilter({
    appId: params.appId,
    rfId: params.filterId,
  });
  const f = response.data;
  return {
    id: f?.id,
    type: f?.type,
    name: f?.attributes?.name,
    enabled: f?.attributes?.enabled,
    eventType: f?.attributes?.eventType,
    query: f?.attributes?.query,
    sampleRate: f?.attributes?.sampleRate,
  };
}

// --- Create Retention Filter ---

export const createRumRetentionFilterSchema = z.object({
  appId: z.string().describe("RUM application ID"),
  name: z.string().describe("Name of the retention filter. Example: Keep all errors"),
  eventType: eventTypeEnum.describe("RUM event type to filter on. Example: error"),
  sampleRate: z.coerce.number().describe("Sample rate between 0 and 100. Example: 100"),
  query: z.string().optional().describe("RUM search query to filter events. Example: @error.source:network"),
  enabled: z.boolean().optional().default(true).describe("Whether the filter is enabled. Default: true"),
});

export async function createRumRetentionFilter(params: z.infer<typeof createRumRetentionFilterSchema>) {
  assertWriteAllowed();

  const attrs = new v2.RumRetentionFilterCreateAttributes();
  attrs.name = params.name;
  attrs.eventType = params.eventType as v2.RumRetentionFilterEventType;
  attrs.sampleRate = params.sampleRate;
  if (params.query) attrs.query = params.query;
  if (params.enabled !== undefined) attrs.enabled = params.enabled;

  const data = new v2.RumRetentionFilterCreateData();
  data.attributes = attrs;
  data.type = "retention_filters";

  const body = new v2.RumRetentionFilterCreateRequest();
  body.data = data;

  const response = await rumRetentionFiltersApi.createRetentionFilter({ appId: params.appId, body });
  const f = response.data;
  return {
    id: f?.id,
    type: f?.type,
    name: f?.attributes?.name,
    enabled: f?.attributes?.enabled,
    eventType: f?.attributes?.eventType,
    query: f?.attributes?.query,
    sampleRate: f?.attributes?.sampleRate,
  };
}

// --- Update Retention Filter ---

export const updateRumRetentionFilterSchema = z.object({
  appId: z.string().describe("RUM application ID"),
  filterId: z.string().describe("Retention filter ID (UUID) to update"),
  name: z.string().optional().describe("New name for the retention filter"),
  eventType: eventTypeEnum.optional().describe("Updated RUM event type"),
  sampleRate: z.coerce.number().optional().describe("Updated sample rate between 0 and 100"),
  query: z.string().optional().describe("Updated RUM search query"),
  enabled: z.boolean().optional().describe("Whether the filter is enabled"),
});

export async function updateRumRetentionFilter(params: z.infer<typeof updateRumRetentionFilterSchema>) {
  assertWriteAllowed();

  const attrs = new v2.RumRetentionFilterUpdateAttributes();
  if (params.name) attrs.name = params.name;
  if (params.eventType) attrs.eventType = params.eventType as v2.RumRetentionFilterEventType;
  if (params.sampleRate !== undefined) attrs.sampleRate = params.sampleRate;
  if (params.query) attrs.query = params.query;
  if (params.enabled !== undefined) attrs.enabled = params.enabled;

  const data = new v2.RumRetentionFilterUpdateData();
  data.id = params.filterId;
  data.attributes = attrs;
  data.type = "retention_filters";

  const body = new v2.RumRetentionFilterUpdateRequest();
  body.data = data;

  const response = await rumRetentionFiltersApi.updateRetentionFilter({
    appId: params.appId,
    rfId: params.filterId,
    body,
  });
  const f = response.data;
  return {
    id: f?.id,
    type: f?.type,
    name: f?.attributes?.name,
    enabled: f?.attributes?.enabled,
    eventType: f?.attributes?.eventType,
    query: f?.attributes?.query,
    sampleRate: f?.attributes?.sampleRate,
  };
}

// --- Delete Retention Filter ---

export const deleteRumRetentionFilterSchema = z.object({
  appId: z.string().describe("RUM application ID"),
  filterId: z.string().describe("Retention filter ID (UUID) to delete"),
});

export async function deleteRumRetentionFilter(params: z.infer<typeof deleteRumRetentionFilterSchema>) {
  assertWriteAllowed();
  await rumRetentionFiltersApi.deleteRetentionFilter({ appId: params.appId, rfId: params.filterId });
  return { deleted: true, appId: params.appId, filterId: params.filterId };
}
