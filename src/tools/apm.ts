import { z } from "zod/v4";
import { spansApi } from "../client.js";
import { applyExtractFields, extractFieldsDescription } from "./extract-fields.js";

export const searchSpansSchema = z.object({
  query: z.string().describe("Span search query. Example: service:api-server resource_name:GET_/users @duration:>5s"),
  from: z.string().describe("Start time (ISO 8601 or relative). Example: 2026-02-26T00:00:00Z or now-1h"),
  to: z.string().describe("End time (ISO 8601 or relative). Example: 2026-02-26T23:59:59Z or now"),
  limit: z.coerce.number().optional().default(50).describe("Max results (default 50, max 1000)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order: -timestamp (newest first) or timestamp (oldest first)"),
  extractFields: z.string().optional().describe(extractFieldsDescription),
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
  const result = {
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
  return applyExtractFields(result, params.extractFields);
}
