import { z } from "zod/v4";
import { metricsApi } from "../client.js";

export const queryMetricsSchema = z.object({
  query: z.string().describe("Datadog metric query string (e.g., avg:system.cpu.user{host:myhost})"),
  from: z.number().describe("Start time as Unix epoch seconds"),
  to: z.number().describe("End time as Unix epoch seconds"),
});

export async function queryMetrics(params: z.infer<typeof queryMetricsSchema>) {
  const response = await metricsApi.queryMetrics({
    from: params.from,
    to: params.to,
    query: params.query,
  });

  const series = response.series ?? [];
  const results = series.map((s) => ({
    metric: s.metric,
    displayName: s.displayName,
    unit: s.unit,
    scope: s.scope,
    expression: s.expression,
    pointCount: s.pointlist?.length ?? 0,
    points: s.pointlist?.map(([ts, val]) => ({
      timestamp: new Date((ts ?? 0) * 1000).toISOString(),
      value: val,
    })),
  }));

  return {
    query: response.query,
    from: response.fromDate ? new Date(response.fromDate).toISOString() : undefined,
    to: response.toDate ? new Date(response.toDate).toISOString() : undefined,
    seriesCount: series.length,
    series: results,
  };
}

export const getMetricsSchema = z.object({
  q: z.string().describe("Search query to filter metrics (e.g., system.cpu)"),
});

export async function getMetrics(params: z.infer<typeof getMetricsSchema>) {
  const response = await metricsApi.listMetrics({
    q: params.q,
  });

  return {
    metrics: response.results?.metrics ?? [],
  };
}

export const getMetricMetadataSchema = z.object({
  metricName: z.string().describe("Full metric name (e.g., system.cpu.user)"),
});

export async function getMetricMetadata(params: z.infer<typeof getMetricMetadataSchema>) {
  const response = await metricsApi.getMetricMetadata({
    metricName: params.metricName,
  });

  return {
    name: params.metricName,
    description: response.description,
    type: response.type,
    unit: response.unit,
    perUnit: response.perUnit,
    shortName: response.shortName,
    integration: response.integration,
    statsdInterval: response.statsdInterval,
  };
}

export const listActiveMetricsSchema = z.object({
  from: z.number().describe("Unix epoch seconds - metrics active since this time"),
  host: z.string().optional().describe("Filter by hostname"),
  tagFilter: z.string().optional().describe("Filter by tag (e.g., env:prod)"),
});

export async function listActiveMetrics(params: z.infer<typeof listActiveMetricsSchema>) {
  const response = await metricsApi.listActiveMetrics({
    from: params.from,
    host: params.host,
    tagFilter: params.tagFilter,
  });

  return {
    metrics: response.metrics ?? [],
    from: response.from,
  };
}
