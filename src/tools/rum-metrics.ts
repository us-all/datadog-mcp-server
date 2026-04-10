import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { rumMetricsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

// --- List RUM Metrics ---

export const listRumMetricsSchema = z.object({});

export async function listRumMetrics() {
  const response = await rumMetricsApi.listRumMetrics();
  const metrics = response.data ?? [];
  return {
    count: metrics.length,
    metrics: metrics.map((m) => ({
      id: m.id,
      type: m.type,
      eventType: m.attributes?.eventType,
      compute: m.attributes?.compute,
      filter: m.attributes?.filter,
      groupBy: m.attributes?.groupBy,
      uniqueness: m.attributes?.uniqueness,
    })),
  };
}

// --- Get RUM Metric ---

export const getRumMetricSchema = z.object({
  metricId: z.string().describe("The name of the rum-based metric. Example: rum.my_custom_count"),
});

export async function getRumMetric(params: z.infer<typeof getRumMetricSchema>) {
  const response = await rumMetricsApi.getRumMetric({ metricId: params.metricId });
  const m = response.data;
  return {
    id: m?.id,
    type: m?.type,
    eventType: m?.attributes?.eventType,
    compute: m?.attributes?.compute,
    filter: m?.attributes?.filter,
    groupBy: m?.attributes?.groupBy,
    uniqueness: m?.attributes?.uniqueness,
  };
}

// --- Create RUM Metric ---

const groupByItemSchema = z.object({
  path: z.string().describe("Path to the value to aggregate over. Example: @view.url_path"),
  tagName: z.string().optional().describe("Tag name for the group. Defaults to path if not specified"),
});

export const createRumMetricSchema = z.object({
  id: z.string().describe("The name of the rum-based metric. Example: rum.page_view_count"),
  eventType: z.enum(["session", "view", "action", "error", "resource", "long_task", "vital"])
    .describe("The RUM event type to use. Example: view"),
  aggregationType: z.enum(["count", "distribution"])
    .describe("Aggregation type. 'count' counts events, 'distribution' creates a distribution metric"),
  path: z.string().optional()
    .describe("Path to the metric value. Required for distribution metrics. Example: @view.loading_time"),
  includePercentiles: z.boolean().optional()
    .describe("Whether to include percentile aggregations. Only for distribution metrics"),
  filterQuery: z.string().optional()
    .describe("RUM search query to filter events. Example: @service:my-app @view.url_path:/checkout"),
  groupBy: z.array(groupByItemSchema).optional()
    .describe("Fields to group the metric by"),
  uniquenessWhen: z.enum(["match", "end"]).optional()
    .describe("When to count uniqueness. Only for session/view event types. 'match' = when event matches, 'end' = when session/view ends"),
});

export async function createRumMetric(params: z.infer<typeof createRumMetricSchema>) {
  assertWriteAllowed();

  const compute = new v2.RumMetricCompute();
  compute.aggregationType = params.aggregationType as v2.RumMetricComputeAggregationType;
  if (params.path) compute.path = params.path;
  if (params.includePercentiles !== undefined) compute.includePercentiles = params.includePercentiles;

  const attrs = new v2.RumMetricCreateAttributes();
  attrs.compute = compute;
  attrs.eventType = params.eventType as v2.RumMetricEventType;

  if (params.filterQuery) {
    const filter = new v2.RumMetricFilter();
    filter.query = params.filterQuery;
    attrs.filter = filter;
  }

  if (params.groupBy) {
    attrs.groupBy = params.groupBy.map((g) => {
      const gb = new v2.RumMetricGroupBy();
      gb.path = g.path;
      if (g.tagName) gb.tagName = g.tagName;
      return gb;
    });
  }

  if (params.uniquenessWhen) {
    const uniqueness = new v2.RumMetricUniqueness();
    uniqueness.when = params.uniquenessWhen as v2.RumMetricUniquenessWhen;
    attrs.uniqueness = uniqueness;
  }

  const data = new v2.RumMetricCreateData();
  data.id = params.id;
  data.attributes = attrs;
  data.type = "rum_metrics";

  const body = new v2.RumMetricCreateRequest();
  body.data = data;

  const response = await rumMetricsApi.createRumMetric({ body });
  const m = response.data;
  return {
    id: m?.id,
    type: m?.type,
    eventType: m?.attributes?.eventType,
    compute: m?.attributes?.compute,
    filter: m?.attributes?.filter,
    groupBy: m?.attributes?.groupBy,
  };
}

// --- Update RUM Metric ---

export const updateRumMetricSchema = z.object({
  metricId: z.string().describe("The name of the rum-based metric to update"),
  includePercentiles: z.boolean().optional()
    .describe("Whether to include percentile aggregations. Only for distribution metrics"),
  filterQuery: z.string().optional()
    .describe("Updated RUM search query to filter events"),
  groupBy: z.array(groupByItemSchema).optional()
    .describe("Updated fields to group the metric by"),
});

export async function updateRumMetric(params: z.infer<typeof updateRumMetricSchema>) {
  assertWriteAllowed();

  const attrs = new v2.RumMetricUpdateAttributes();

  if (params.includePercentiles !== undefined) {
    const compute = new v2.RumMetricUpdateCompute();
    compute.includePercentiles = params.includePercentiles;
    attrs.compute = compute;
  }

  if (params.filterQuery) {
    const filter = new v2.RumMetricFilter();
    filter.query = params.filterQuery;
    attrs.filter = filter;
  }

  if (params.groupBy) {
    attrs.groupBy = params.groupBy.map((g) => {
      const gb = new v2.RumMetricGroupBy();
      gb.path = g.path;
      if (g.tagName) gb.tagName = g.tagName;
      return gb;
    });
  }

  const data = new v2.RumMetricUpdateData();
  data.attributes = attrs;
  data.type = "rum_metrics";

  const body = new v2.RumMetricUpdateRequest();
  body.data = data;

  const response = await rumMetricsApi.updateRumMetric({ metricId: params.metricId, body });
  const m = response.data;
  return {
    id: m?.id,
    type: m?.type,
    eventType: m?.attributes?.eventType,
    compute: m?.attributes?.compute,
    filter: m?.attributes?.filter,
    groupBy: m?.attributes?.groupBy,
  };
}

// --- Delete RUM Metric ---

export const deleteRumMetricSchema = z.object({
  metricId: z.string().describe("The name of the rum-based metric to delete"),
});

export async function deleteRumMetric(params: z.infer<typeof deleteRumMetricSchema>) {
  assertWriteAllowed();
  await rumMetricsApi.deleteRumMetric({ metricId: params.metricId });
  return { deleted: true, metricId: params.metricId };
}
