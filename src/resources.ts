import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { monitorsApi, dashboardsApi, slosApi, incidentsApi, hostsApi } from "./client.js";

/**
 * MCP Resources for hot Datadog entities.
 * URI scheme: `dd://`
 *   - dd://monitor/{id}        — monitor by ID
 *   - dd://dashboard/{id}      — dashboard by ID
 *   - dd://slo/{id}            — SLO by ID
 *   - dd://incident/{id}       — incident by ID
 */

function asJson(uri: string, data: unknown) {
  return {
    contents: [{
      uri,
      mimeType: "application/json",
      text: JSON.stringify(data, null, 2),
    }],
  };
}

export function registerResources(server: McpServer): void {
  server.registerResource(
    "monitor",
    new ResourceTemplate("dd://monitor/{id}", { list: undefined }),
    {
      title: "Datadog Monitor",
      description: "Monitor configuration + state by ID",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const id = Number(vars.id);
      const data = await monitorsApi.getMonitor({ monitorId: id });
      return asJson(uri.toString(), data);
    },
  );

  server.registerResource(
    "dashboard",
    new ResourceTemplate("dd://dashboard/{id}", { list: undefined }),
    {
      title: "Datadog Dashboard",
      description: "Dashboard with widgets by ID",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const data = await dashboardsApi.getDashboard({ dashboardId: String(vars.id) });
      return asJson(uri.toString(), data);
    },
  );

  server.registerResource(
    "slo",
    new ResourceTemplate("dd://slo/{id}", { list: undefined }),
    {
      title: "Datadog SLO",
      description: "Service Level Objective by ID",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const data = await slosApi.getSLO({ sloId: String(vars.id) });
      return asJson(uri.toString(), data);
    },
  );

  server.registerResource(
    "incident",
    new ResourceTemplate("dd://incident/{id}", { list: undefined }),
    {
      title: "Datadog Incident",
      description: "Incident details by ID",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const data = await incidentsApi.getIncident({ incidentId: String(vars.id) });
      return asJson(uri.toString(), data);
    },
  );

  // Host search by name: dd://host/{name}
  server.registerResource(
    "host",
    new ResourceTemplate("dd://host/{name}", { list: undefined }),
    {
      title: "Datadog Host",
      description: "Host metadata, tags, and infra status by hostname",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const name = decodeURIComponent(String(vars.name));
      const data = await hostsApi.listHosts({ filter: `host:${name}`, count: 1 });
      return asJson(uri.toString(), data);
    },
  );
}
