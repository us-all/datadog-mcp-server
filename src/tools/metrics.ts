import { z } from "zod/v4";
import { metricsApi, metricsV2Api } from "../client.js";

export const queryMetricsSchema = z.object({
  query: z.string().describe("Datadog metric query string. Example: avg:system.cpu.user{host:myhost} by {env}"),
  from: z.coerce.number().describe("Start time as Unix epoch seconds. Example: 1740000000"),
  to: z.coerce.number().describe("End time as Unix epoch seconds. Example: 1740003600"),
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
  q: z.string().describe("Search query to filter metrics by name. Example: system.cpu"),
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
  metricName: z.string().describe("Full metric name. Example: system.cpu.user"),
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
  from: z.coerce.number().describe("Unix epoch seconds — metrics active since this time. Example: 1740000000"),
  host: z.string().optional().describe("Filter by hostname. Example: i-0123456789abcdef0"),
  tagFilter: z.string().optional().describe("Filter by tag. Example: env:prod"),
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

export const listMetricTagsSchema = z.object({
  metricName: z.string().describe("Full metric name. Example: system.cpu.user"),
  windowSeconds: z.coerce.number().optional().describe("Look-back window in seconds (default: 14400 = 4h, min: 14400). Example: 86400"),
});

export async function listMetricTags(params: z.infer<typeof listMetricTagsSchema>) {
  const response = await metricsV2Api.listTagsByMetricName({
    metricName: params.metricName,
    windowSeconds: params.windowSeconds,
  });

  return {
    metric: params.metricName,
    tags: response.data?.attributes?.tags ?? [],
  };
}
