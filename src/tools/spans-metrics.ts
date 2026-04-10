import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { spansMetricsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

// --- List Spans Metrics ---

export const listSpansMetricsSchema = z.object({});

export async function listSpansMetrics() {
  const response = await spansMetricsApi.listSpansMetrics();
  const metrics = response.data ?? [];
  return {
    count: metrics.length,
    metrics: metrics.map(formatSpansMetric),
  };
}

// --- Get Spans Metric ---

export const getSpansMetricSchema = z.object({
  metricId: z.string().describe("The name of the span-based metric. Example: spans.my_custom_count"),
});

export async function getSpansMetric(params: z.infer<typeof getSpansMetricSchema>) {
  const response = await spansMetricsApi.getSpansMetric({ metricId: params.metricId });
  return formatSpansMetric(response.data!);
}

// --- Create Spans Metric ---

const groupByItemSchema = z.object({
  path: z.string().describe("Path to the value to aggregate over. Example: @resource_name"),
  tagName: z.string().optional().describe("Tag name for the group. Defaults to path if not specified"),
});

export const createSpansMetricSchema = z.object({
  id: z.string().describe("The name of the span-based metric. Example: spans.request_duration"),
  aggregationType: z.enum(["count", "distribution"])
    .describe("Aggregation type. 'count' counts span events, 'distribution' creates a distribution metric"),
  path: z.string().optional()
    .describe("Path to the metric value. Required for distribution metrics. Example: @duration"),
  includePercentiles: z.boolean().optional()
    .describe("Whether to include percentile aggregations. Only for distribution metrics"),
  filterQuery: z.string().optional()
    .describe("APM search query to filter spans. Example: service:web-app resource_name:GET_/api/users"),
  groupBy: z.array(groupByItemSchema).optional()
    .describe("Fields to group the metric by"),
});

export async function createSpansMetric(params: z.infer<typeof createSpansMetricSchema>) {
  assertWriteAllowed();

  const compute = new v2.SpansMetricCompute();
  compute.aggregationType = params.aggregationType as v2.SpansMetricComputeAggregationType;
  if (params.path) compute.path = params.path;
  if (params.includePercentiles !== undefined) compute.includePercentiles = params.includePercentiles;

  const attrs = new v2.SpansMetricCreateAttributes();
  attrs.compute = compute;

  if (params.filterQuery) {
    const filter = new v2.SpansMetricFilter();
    filter.query = params.filterQuery;
    attrs.filter = filter;
  }

  if (params.groupBy) {
    attrs.groupBy = params.groupBy.map((g) => {
      const gb = new v2.SpansMetricGroupBy();
      gb.path = g.path;
      if (g.tagName) gb.tagName = g.tagName;
      return gb;
    });
  }

  const data = new v2.SpansMetricCreateData();
  data.id = params.id;
  data.attributes = attrs;
  data.type = "spans_metrics" as v2.SpansMetricType;

  const body = new v2.SpansMetricCreateRequest();
  body.data = data;

  const response = await spansMetricsApi.createSpansMetric({ body });
  return formatSpansMetric(response.data!);
}

// --- Update Spans Metric ---

export const updateSpansMetricSchema = z.object({
  metricId: z.string().describe("The name of the span-based metric to update"),
  includePercentiles: z.boolean().optional()
    .describe("Whether to include percentile aggregations. Only for distribution metrics"),
  filterQuery: z.string().optional()
    .describe("Updated APM search query to filter spans"),
  groupBy: z.array(groupByItemSchema).optional()
    .describe("Updated fields to group the metric by"),
});

export async function updateSpansMetric(params: z.infer<typeof updateSpansMetricSchema>) {
  assertWriteAllowed();

  const attrs = new v2.SpansMetricUpdateAttributes();

  if (params.includePercentiles !== undefined) {
    const compute = new v2.SpansMetricUpdateCompute();
    compute.includePercentiles = params.includePercentiles;
    attrs.compute = compute;
  }

  if (params.filterQuery) {
    const filter = new v2.SpansMetricFilter();
    filter.query = params.filterQuery;
    attrs.filter = filter;
  }

  if (params.groupBy) {
    attrs.groupBy = params.groupBy.map((g) => {
      const gb = new v2.SpansMetricGroupBy();
      gb.path = g.path;
      if (g.tagName) gb.tagName = g.tagName;
      return gb;
    });
  }

  const data = new v2.SpansMetricUpdateData();
  data.attributes = attrs;
  data.type = "spans_metrics" as v2.SpansMetricType;

  const body = new v2.SpansMetricUpdateRequest();
  body.data = data;

  const response = await spansMetricsApi.updateSpansMetric({ metricId: params.metricId, body });
  return formatSpansMetric(response.data!);
}

// --- Delete Spans Metric ---

export const deleteSpansMetricSchema = z.object({
  metricId: z.string().describe("The name of the span-based metric to delete"),
});

export async function deleteSpansMetric(params: z.infer<typeof deleteSpansMetricSchema>) {
  assertWriteAllowed();
  await spansMetricsApi.deleteSpansMetric({ metricId: params.metricId });
  return { deleted: true, metricId: params.metricId };
}

// --- Helper ---

function formatSpansMetric(m: v2.SpansMetricResponseData) {
  return {
    id: m.id,
    type: m.type,
    compute: m.attributes?.compute,
    filter: m.attributes?.filter,
    groupBy: m.attributes?.groupBy,
  };
}
