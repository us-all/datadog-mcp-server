import { z } from "zod/v4";
import { securityMonitoringApi } from "../client.js";

export const searchSecuritySignalsSchema = z.object({
  query: z.string().optional().default("*").describe("Security signal search query. Example: type:log_detection status:high or *"),
  from: z.string().describe("Start time (ISO 8601). Example: 2026-02-26T00:00:00Z"),
  to: z.string().describe("End time (ISO 8601). Example: 2026-02-26T23:59:59Z"),
  limit: z.coerce.number().optional().default(50).describe("Max results (default 50, max 1000)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order: -timestamp (newest first) or timestamp (oldest first)"),
});

export async function searchSecuritySignals(params: z.infer<typeof searchSecuritySignalsSchema>) {
  const response = await securityMonitoringApi.searchSecurityMonitoringSignals({
    body: {
      filter: {
        query: params.query,
        from: new Date(params.from),
        to: new Date(params.to),
      },
      page: {
        limit: params.limit,
      },
      sort: params.sort === "timestamp" ? "timestamp" : "-timestamp",
    },
  });

  const signals = response.data ?? [];
  return {
    count: signals.length,
    signals: signals.map((s) => ({
      id: s.id,
      type: s.type,
      message: s.attributes?.message,
      timestamp: s.attributes?.timestamp?.toISOString(),
      tags: s.attributes?.tags,
      custom: s.attributes?.custom,
    })),
  };
}
