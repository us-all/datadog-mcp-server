import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { apmRetentionFiltersApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

// --- List APM Retention Filters ---

export const listApmRetentionFiltersSchema = z.object({});

export async function listApmRetentionFilters() {
  const response = await apmRetentionFiltersApi.listApmRetentionFilters();
  const filters = response.data ?? [];
  return {
    count: filters.length,
    filters: filters.map(formatRetentionFilter),
  };
}

// --- Get APM Retention Filter ---

export const getApmRetentionFilterSchema = z.object({
  filterId: z.string().describe("The retention filter ID"),
});

export async function getApmRetentionFilter(params: z.infer<typeof getApmRetentionFilterSchema>) {
  const response = await apmRetentionFiltersApi.getApmRetentionFilter({
    filterId: params.filterId,
  });

  return formatRetentionFilter(response.data!);
}

// --- Create APM Retention Filter ---

export const createApmRetentionFilterSchema = z.object({
  name: z.string().describe("Name of the retention filter"),
  filterQuery: z.string().describe("Span search query. Example: service:web-app AND @duration:>1s"),
  rate: z.coerce.number().describe("Sample rate (0.0 to 1.0). Example: 1.0 for 100%, 0.5 for 50%"),
  enabled: z.boolean().optional().default(true).describe("Whether the filter is enabled (default true)"),
});

export async function createApmRetentionFilter(params: z.infer<typeof createApmRetentionFilterSchema>) {
  assertWriteAllowed();

  const filter = new v2.SpansFilterCreate();
  filter.query = params.filterQuery;

  const attributes = new v2.RetentionFilterCreateAttributes();
  attributes.name = params.name;
  attributes.filter = filter;
  attributes.filterType = "spans-sampling-processor" as v2.RetentionFilterType;
  attributes.rate = params.rate;
  attributes.enabled = params.enabled ?? true;

  const data = new v2.RetentionFilterCreateData();
  data.type = "apm_retention_filter" as v2.ApmRetentionFilterType;
  data.attributes = attributes;

  const body = new v2.RetentionFilterCreateRequest();
  body.data = data;

  const response = await apmRetentionFiltersApi.createApmRetentionFilter({ body });
  return formatRetentionFilter(response.data!);
}

// --- Update APM Retention Filter ---

export const updateApmRetentionFilterSchema = z.object({
  filterId: z.string().describe("The retention filter ID to update"),
  name: z.string().describe("Updated name of the retention filter"),
  filterQuery: z.string().describe("Updated span search query"),
  rate: z.coerce.number().describe("Updated sample rate (0.0 to 1.0)"),
  enabled: z.boolean().describe("Whether the filter is enabled"),
});

export async function updateApmRetentionFilter(params: z.infer<typeof updateApmRetentionFilterSchema>) {
  assertWriteAllowed();

  const filter = new v2.SpansFilterCreate();
  filter.query = params.filterQuery;

  const attributes = new v2.RetentionFilterUpdateAttributes();
  attributes.name = params.name;
  attributes.filter = filter;
  attributes.filterType = "spans-sampling-processor" as v2.RetentionFilterAllType;
  attributes.rate = params.rate;
  attributes.enabled = params.enabled;

  const data = new v2.RetentionFilterUpdateData();
  data.type = "apm_retention_filter" as v2.ApmRetentionFilterType;
  data.attributes = attributes;

  const body = new v2.RetentionFilterUpdateRequest();
  body.data = data;

  const response = await apmRetentionFiltersApi.updateApmRetentionFilter({
    filterId: params.filterId,
    body,
  });
  return formatRetentionFilter(response.data!);
}

// --- Delete APM Retention Filter ---

export const deleteApmRetentionFilterSchema = z.object({
  filterId: z.string().describe("The retention filter ID to delete"),
});

export async function deleteApmRetentionFilter(params: z.infer<typeof deleteApmRetentionFilterSchema>) {
  assertWriteAllowed();
  await apmRetentionFiltersApi.deleteApmRetentionFilter({
    filterId: params.filterId,
  });
  return { deleted: true, filterId: params.filterId };
}

// --- Helper ---

function formatRetentionFilter(f: v2.RetentionFilter | v2.RetentionFilterAll) {
  const r = f as unknown as Record<string, unknown>;
  const attrs = r.attributes as Record<string, unknown> | undefined;
  return {
    id: r.id,
    type: r.type,
    name: attrs?.name,
    enabled: attrs?.enabled,
    filterType: attrs?.filterType,
    filter: attrs?.filter,
    rate: attrs?.rate,
    traceRate: attrs?.traceRate,
    executionOrder: attrs?.executionOrder,
    editable: attrs?.editable,
    createdAt: attrs?.createdAt,
    modifiedAt: attrs?.modifiedAt,
    createdBy: attrs?.createdBy,
    modifiedBy: attrs?.modifiedBy,
  };
}
