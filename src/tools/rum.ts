import { z } from "zod/v4";
import { rumApi } from "../client.js";

export const searchRumEventsSchema = z.object({
  query: z.string().describe("RUM search query (e.g., service:us-app-prod @type:error)"),
  from: z.string().describe("Start time as ISO 8601 string"),
  to: z.string().describe("End time as ISO 8601 string"),
  limit: z.number().optional().default(50).describe("Max results (default 50)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order"),
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
  query: z.string().describe("RUM filter query"),
  from: z.string().describe("Start time as ISO 8601 string"),
  to: z.string().describe("End time as ISO 8601 string"),
  aggregation: z.enum(["count", "cardinality", "avg", "sum", "min", "max", "pc75", "pc90", "pc95", "pc98", "pc99"]).describe("Aggregation type"),
  metric: z.string().optional().describe("Metric field for non-count aggregations (e.g., @view.loading_time)"),
  groupBy: z.string().optional().describe("Field to group by (e.g., @application.id, @view.url_path)"),
});

export async function aggregateRum(params: z.infer<typeof aggregateRumSchema>) {
  const compute: Array<{ aggregation: string; metric?: string }> = [
    { aggregation: params.aggregation, ...(params.metric ? { metric: params.metric } : {}) },
  ];

  const groupBy = params.groupBy
    ? [{ facet: params.groupBy, limit: 10, sort: { aggregation: params.aggregation } as Record<string, unknown> }]
    : undefined;

  const response = await rumApi.aggregateRUMEvents({
    body: {
      compute: compute as any,
      filter: {
        query: params.query,
        from: params.from,
        to: params.to,
      },
      ...(groupBy ? { groupBy: groupBy as any } : {}),
    },
  });

  return {
    buckets: response.data?.buckets ?? [],
    meta: response.meta,
  };
}
