import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { rumApi } from "../client.js";

export const searchRumEventsSchema = z.object({
  query: z.string().describe("RUM search query. Example: service:my-app @type:error @session.type:user"),
  from: z.string().describe("Start time (ISO 8601). Example: 2026-02-26T00:00:00Z"),
  to: z.string().describe("End time (ISO 8601). Example: 2026-02-26T23:59:59Z"),
  limit: z.number().optional().default(50).describe("Max results (default 50, max 1000)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order: -timestamp (newest first) or timestamp (oldest first)"),
});

export async function searchRumEvents(params: z.infer<typeof searchRumEventsSchema>) {
  const response = await rumApi.listRUMEvents({
    filterQuery: params.query,
    filterFrom: new Date(params.from),
    filterTo: new Date(params.to),
    pageLimit: params.limit,
    sort: params.sort === "timestamp" ? "timestamp" : "-timestamp",
  });

  const events = response.data ?? [];
  return {
    count: events.length,
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      timestamp: e.attributes?.timestamp?.toISOString(),
      service: e.attributes?.service,
      attributes: e.attributes?.attributes,
      tags: e.attributes?.tags,
    })),
  };
}

export const aggregateRumSchema = z.object({
  query: z.string().describe("RUM filter query. Example: service:my-app @type:view"),
  from: z.string().describe("Start time (ISO 8601). Example: 2026-02-26T00:00:00Z"),
  to: z.string().describe("End time (ISO 8601). Example: 2026-02-26T23:59:59Z"),
  aggregation: z.enum(["count", "cardinality", "avg", "sum", "min", "max", "pc75", "pc90", "pc95", "pc98", "pc99"]).describe("Aggregation function. Example: count or avg"),
  metric: z.string().optional().describe("Metric field for non-count aggregations. Example: @view.loading_time or @action.loading_time"),
  groupBy: z.string().optional().describe("Field to group by. Example: @application.id or @view.url_path or @geo.country"),
});

export async function aggregateRum(params: z.infer<typeof aggregateRumSchema>) {
  const compute = new v2.RUMCompute();
  compute.aggregation = params.aggregation as v2.RUMAggregationFunction;
  if (params.metric) {
    compute.metric = params.metric;
  }

  const filter = new v2.RUMQueryFilter();
  filter.query = params.query;
  filter.from = params.from;
  filter.to = params.to;

  const body = new v2.RUMAggregateRequest();
  body.compute = [compute];
  body.filter = filter;

  if (params.groupBy) {
    const groupBy = new v2.RUMGroupBy();
    groupBy.facet = params.groupBy;
    groupBy.limit = 10;

    body.groupBy = [groupBy];
  }

  const response = await rumApi.aggregateRUMEvents({ body });

  return {
    buckets: response.data?.buckets ?? [],
    meta: response.meta,
  };
}
