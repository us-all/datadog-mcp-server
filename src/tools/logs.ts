import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { logsApi, logsV1Api } from "../client.js";

export const searchLogsSchema = z.object({
  query: z.string().describe("Log search query (e.g., service:api status:error)"),
  from: z.string().describe("Start time as ISO 8601 string (e.g., 2024-01-01T00:00:00Z)"),
  to: z.string().describe("End time as ISO 8601 string"),
  limit: z.number().optional().default(50).describe("Max results (default 50, max 1000)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order (default: newest first)"),
  indexes: z.array(z.string()).optional().describe("Log indexes to search"),
});

export async function searchLogs(params: z.infer<typeof searchLogsSchema>) {
  const response = await logsApi.listLogsGet({
    filterQuery: params.query,
    filterFrom: new Date(params.from),
    filterTo: new Date(params.to),
    filterIndexes: params.indexes,
    pageLimit: params.limit,
    sort: params.sort === "timestamp" ? "timestamp" : "-timestamp",
  });

  const logs = response.data ?? [];
  return {
    count: logs.length,
    logs: logs.map((log) => ({
      id: log.id,
      timestamp: log.attributes?.timestamp?.toISOString(),
      status: log.attributes?.status,
      service: log.attributes?.service,
      message: log.attributes?.message,
      host: log.attributes?.host,
      tags: log.attributes?.tags,
      attributes: log.attributes?.attributes,
    })),
  };
}

export const aggregateLogsSchema = z.object({
  query: z.string().describe("Log filter query"),
  from: z.string().describe("Start time as ISO 8601 string"),
  to: z.string().describe("End time as ISO 8601 string"),
  aggregation: z.enum(["count", "cardinality", "avg", "sum", "min", "max", "pc75", "pc90", "pc95", "pc98", "pc99"]).describe("Aggregation type"),
  metric: z.string().optional().describe("Metric field for non-count aggregations (e.g., @duration)"),
  groupBy: z.string().optional().describe("Field to group by (e.g., service, status)"),
});

export async function aggregateLogs(params: z.infer<typeof aggregateLogsSchema>) {
  const compute = new v2.LogsCompute();
  compute.aggregation = params.aggregation as v2.LogsAggregationFunction;
  compute.type = "total" as v2.LogsComputeType;
  if (params.metric) {
    compute.metric = params.metric;
  }

  const filter = new v2.LogsQueryFilter();
  filter.query = params.query;
  filter.from = params.from;
  filter.to = params.to;

  const body = new v2.LogsAggregateRequest();
  body.compute = [compute];
  body.filter = filter;

  if (params.groupBy) {
    const groupBy = new v2.LogsGroupBy();
    groupBy.facet = params.groupBy;
    groupBy.limit = 10;

    body.groupBy = [groupBy];
  }

  const response = await logsApi.aggregateLogs({ body });

  return {
    buckets: response.data?.buckets ?? [],
    meta: response.meta,
  };
}

export const sendLogsSchema = z.object({
  logs: z.array(z.object({
    message: z.string().describe("Log message"),
    service: z.string().optional().describe("Service name"),
    hostname: z.string().optional().describe("Originating host"),
    ddsource: z.string().optional().describe("Source integration name"),
    ddtags: z.string().optional().describe("Tags (comma-separated)"),
    status: z.string().optional().describe("Log status (info, warn, error)"),
  })).describe("Array of log entries to send"),
});

export async function sendLogs(params: z.infer<typeof sendLogsSchema>) {
  const response = await logsV1Api.submitLog({
    body: params.logs.map((log) => ({
      message: log.message,
      service: log.service,
      hostname: log.hostname,
      ddsource: log.ddsource,
      ddtags: log.ddtags,
      ...(log.status ? { status: log.status } : {}),
    })) as any,
  });

  return {
    success: true,
    count: params.logs.length,
  };
}
