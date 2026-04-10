import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { logsMetricsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

// --- List Logs Metrics ---

export const listLogsMetricsSchema = z.object({});

export async function listLogsMetrics() {
  const response = await logsMetricsApi.listLogsMetrics();
  const metrics = response.data ?? [];
  return {
    count: metrics.length,
    metrics: metrics.map(formatLogsMetric),
  };
}

// --- Get Logs Metric ---

export const getLogsMetricSchema = z.object({
  metricId: z.string().describe("The name of the log-based metric. Example: logs.my_custom_count"),
});

export async function getLogsMetric(params: z.infer<typeof getLogsMetricSchema>) {
  const response = await logsMetricsApi.getLogsMetric({ metricId: params.metricId });
  return formatLogsMetric(response.data!);
}

// --- Create Logs Metric ---

const groupByItemSchema = z.object({
  path: z.string().describe("Path to the value to aggregate over. Example: @http.status_code"),
  tagName: z.string().optional().describe("Tag name for the group. Defaults to path if not specified"),
});

export const createLogsMetricSchema = z.object({
  id: z.string().describe("The name of the log-based metric. Example: logs.status_code_count"),
  aggregationType: z.enum(["count", "distribution"])
    .describe("Aggregation type. 'count' counts log events, 'distribution' creates a distribution metric"),
  path: z.string().optional()
    .describe("Path to the metric value. Required for distribution metrics. Example: @duration"),
  includePercentiles: z.boolean().optional()
    .describe("Whether to include percentile aggregations. Only for distribution metrics"),
  filterQuery: z.string().optional()
    .describe("Log search query to filter events. Example: service:web-app status:error"),
  groupBy: z.array(groupByItemSchema).optional()
    .describe("Fields to group the metric by"),
});

export async function createLogsMetric(params: z.infer<typeof createLogsMetricSchema>) {
  assertWriteAllowed();

  const compute = new v2.LogsMetricCompute();
  compute.aggregationType = params.aggregationType as v2.LogsMetricComputeAggregationType;
  if (params.path) compute.path = params.path;
  if (params.includePercentiles !== undefined) compute.includePercentiles = params.includePercentiles;

  const attrs = new v2.LogsMetricCreateAttributes();
  attrs.compute = compute;

  if (params.filterQuery) {
    const filter = new v2.LogsMetricFilter();
    filter.query = params.filterQuery;
    attrs.filter = filter;
  }

  if (params.groupBy) {
    attrs.groupBy = params.groupBy.map((g) => {
      const gb = new v2.LogsMetricGroupBy();
      gb.path = g.path;
      if (g.tagName) gb.tagName = g.tagName;
      return gb;
    });
  }

  const data = new v2.LogsMetricCreateData();
  data.id = params.id;
  data.attributes = attrs;
  data.type = "logs_metrics" as v2.LogsMetricType;

  const body = new v2.LogsMetricCreateRequest();
  body.data = data;

  const response = await logsMetricsApi.createLogsMetric({ body });
  return formatLogsMetric(response.data!);
}

// --- Update Logs Metric ---

export const updateLogsMetricSchema = z.object({
  metricId: z.string().describe("The name of the log-based metric to update"),
  includePercentiles: z.boolean().optional()
    .describe("Whether to include percentile aggregations. Only for distribution metrics"),
  filterQuery: z.string().optional()
    .describe("Updated log search query to filter events"),
  groupBy: z.array(groupByItemSchema).optional()
    .describe("Updated fields to group the metric by"),
});

export async function updateLogsMetric(params: z.infer<typeof updateLogsMetricSchema>) {
  assertWriteAllowed();

  const attrs = new v2.LogsMetricUpdateAttributes();

  if (params.includePercentiles !== undefined) {
    const compute = new v2.LogsMetricUpdateCompute();
    compute.includePercentiles = params.includePercentiles;
    attrs.compute = compute;
  }

  if (params.filterQuery) {
    const filter = new v2.LogsMetricFilter();
    filter.query = params.filterQuery;
    attrs.filter = filter;
  }

  if (params.groupBy) {
    attrs.groupBy = params.groupBy.map((g) => {
      const gb = new v2.LogsMetricGroupBy();
      gb.path = g.path;
      if (g.tagName) gb.tagName = g.tagName;
      return gb;
    });
  }

  const data = new v2.LogsMetricUpdateData();
  data.attributes = attrs;
  data.type = "logs_metrics" as v2.LogsMetricType;

  const body = new v2.LogsMetricUpdateRequest();
  body.data = data;

  const response = await logsMetricsApi.updateLogsMetric({ metricId: params.metricId, body });
  return formatLogsMetric(response.data!);
}

// --- Delete Logs Metric ---

export const deleteLogsMetricSchema = z.object({
  metricId: z.string().describe("The name of the log-based metric to delete"),
});

export async function deleteLogsMetric(params: z.infer<typeof deleteLogsMetricSchema>) {
  assertWriteAllowed();
  await logsMetricsApi.deleteLogsMetric({ metricId: params.metricId });
  return { deleted: true, metricId: params.metricId };
}

// --- Helper ---

function formatLogsMetric(m: v2.LogsMetricResponseData) {
  return {
    id: m.id,
    type: m.type,
    compute: m.attributes?.compute,
    filter: m.attributes?.filter,
    groupBy: m.attributes?.groupBy,
  };
}
