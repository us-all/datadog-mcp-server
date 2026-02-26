import { z } from "zod/v4";
import { securityMonitoringApi } from "../client.js";

export const searchSecuritySignalsSchema = z.object({
  query: z.string().optional().default("*").describe("Security signal search query"),
  from: z.string().describe("Start time as ISO 8601 string"),
  to: z.string().describe("End time as ISO 8601 string"),
  limit: z.number().optional().default(50).describe("Max results (default 50)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order"),
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
