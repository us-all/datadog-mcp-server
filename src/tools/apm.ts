import { z } from "zod/v4";
import { spansApi } from "../client.js";

export const searchSpansSchema = z.object({
  query: z.string().describe("Span search query (e.g., service:api-server resource_name:GET_/users)"),
  from: z.string().describe("Start time as ISO 8601 string or relative (e.g., now-1h)"),
  to: z.string().describe("End time as ISO 8601 string or relative (e.g., now)"),
  limit: z.number().optional().default(50).describe("Max results (default 50)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order (default: newest first)"),
});

export async function searchSpans(params: z.infer<typeof searchSpansSchema>) {
  const response = await spansApi.listSpansGet({
    filterQuery: params.query,
    filterFrom: params.from,
    filterTo: params.to,
    pageLimit: params.limit,
    sort: params.sort === "timestamp" ? "timestamp" : "-timestamp",
  });

  const spans = response.data ?? [];
  return {
    count: spans.length,
    spans: spans.map((s) => ({
      id: s.id,
      traceId: s.attributes?.traceId,
      spanId: s.attributes?.spanId,
      parentId: s.attributes?.parentId,
      service: s.attributes?.service,
      resourceName: s.attributes?.resourceName,
      type: s.attributes?.type,
      env: s.attributes?.env,
      host: s.attributes?.host,
      startTimestamp: s.attributes?.startTimestamp?.toISOString(),
      endTimestamp: s.attributes?.endTimestamp?.toISOString(),
      ingestionReason: s.attributes?.ingestionReason,
      tags: s.attributes?.tags,
      custom: s.attributes?.custom,
      attributes: s.attributes?.attributes,
    })),
  };
}
