import { z } from "zod/v4";
import { auditApi } from "../client.js";

export const searchAuditLogsSchema = z.object({
  query: z.string().optional().default("*").describe("Audit log search query. Example: @action:created @resource_type:dashboard"),
  from: z.string().describe("Start time (ISO 8601 or relative). Example: 2026-03-01T00:00:00Z or now-24h"),
  to: z.string().describe("End time (ISO 8601 or relative). Example: 2026-03-02T00:00:00Z or now"),
  limit: z.number().optional().default(50).describe("Max results (default 50, max 1000)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order: -timestamp (newest first) or timestamp (oldest first)"),
});

export async function searchAuditLogs(params: z.infer<typeof searchAuditLogsSchema>) {
  const response = await auditApi.searchAuditLogs({
    body: {
      filter: {
        query: params.query,
        from: params.from,
        to: params.to,
      },
      page: {
        limit: params.limit,
      },
      sort: params.sort === "timestamp" ? "timestamp" : "-timestamp",
    },
  });

  const logs = response.data ?? [];
  return {
    count: logs.length,
    logs: logs.map((l) => ({
      id: l.id,
      type: l.type,
      action: l.attributes?.attributes?.action,
      resourceType: l.attributes?.attributes?.resourceType,
      resourceName: l.attributes?.attributes?.resourceName,
      userName: l.attributes?.attributes?.usr?.name,
      userEmail: l.attributes?.attributes?.usr?.email,
      timestamp: l.attributes?.timestamp?.toISOString(),
      message: l.attributes?.message,
      service: l.attributes?.service,
      tags: l.attributes?.tags,
    })),
  };
}
