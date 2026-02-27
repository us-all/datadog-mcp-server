import { z } from "zod/v4";
import { hostsApi } from "../client.js";

export const listHostsSchema = z.object({
  filter: z.string().optional().describe("Filter string for search results. Example: web-server or env:prod"),
  sortField: z.string().optional().describe("Field to sort by. Example: apps, cpu, iowait, load"),
  sortDir: z.string().optional().describe("Sort direction: asc or desc"),
  count: z.number().optional().default(100).describe("Number of hosts to return (max 1000)"),
  start: z.number().optional().default(0).describe("Pagination offset"),
  from: z.number().optional().describe("Unix epoch seconds — hosts active since this time. Example: 1740000000"),
  includeMutedHostsData: z.boolean().optional().describe("Include mute status info"),
  includeHostsMetadata: z.boolean().optional().describe("Include agent_version, machine, platform, processor"),
});

export async function listHosts(params: z.infer<typeof listHostsSchema>) {
  const response = await hostsApi.listHosts({
    filter: params.filter,
    sortField: params.sortField,
    sortDir: params.sortDir,
    count: params.count,
    start: params.start,
    from: params.from,
    includeMutedHostsData: params.includeMutedHostsData,
    includeHostsMetadata: params.includeHostsMetadata,
  });

  const hosts = response.hostList ?? [];
  return {
    totalMatching: response.totalMatching,
    totalReturned: response.totalReturned,
    hosts: hosts.map((h) => ({
      id: h.id,
      name: h.name,
      aliases: h.aliases,
      apps: h.apps,
      isMuted: h.isMuted,
      lastReportedTime: h.lastReportedTime,
      up: h.up,
      meta: h.meta,
      metrics: h.metrics,
      sources: h.sources,
      tagsBySource: h.tagsBySource,
    })),
  };
}

export const getHostTotalsSchema = z.object({
  from: z.number().optional().describe("Unix epoch seconds — get totals from this time. Example: 1740000000"),
});

export async function getHostTotals(params: z.infer<typeof getHostTotalsSchema>) {
  const response = await hostsApi.getHostTotals({
    from: params.from,
  });

  return {
    totalActive: response.totalActive,
    totalUp: response.totalUp,
  };
}
