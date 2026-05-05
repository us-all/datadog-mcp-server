import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  monitorsApi,
  dashboardsApi,
  slosApi,
  incidentsApi,
  hostsApi,
  softwareCatalogApi,
  teamsApi,
  syntheticsApi,
} from "./client.js";

const UI_DIR = join(dirname(fileURLToPath(import.meta.url)), "ui");
const SLO_SNAPSHOT_HTML = readFileSync(join(UI_DIR, "slo-compliance-snapshot.html"), "utf-8");

/**
 * MCP Resources for hot Datadog entities.
 * URI scheme: `dd://`
 *   - dd://monitor/{id}            — monitor by ID
 *   - dd://dashboard/{id}          — dashboard by ID
 *   - dd://slo/{id}                — SLO by ID
 *   - dd://incident/{id}           — incident by ID
 *   - dd://host/{name}             — host metadata by hostname
 *   - dd://service/{serviceName}   — service definition (software catalog entity)
 *   - dd://team/{teamId}           — team metadata + members
 *   - dd://synthetics/{testId}     — synthetics test definition by public ID
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

  // Service definition by name: dd://service/{serviceName}
  server.registerResource(
    "service",
    new ResourceTemplate("dd://service/{serviceName}", { list: undefined }),
    {
      title: "Datadog Service Definition",
      description: "Software catalog entity (service definition) by name",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const serviceName = decodeURIComponent(String(vars.serviceName));
      const response = await softwareCatalogApi.listCatalogEntity({
        filterName: serviceName,
        pageLimit: 1,
      });
      const entity = response.data?.[0];
      if (!entity) {
        return asJson(uri.toString(), { error: `Service not found: ${serviceName}` });
      }
      return asJson(uri.toString(), {
        id: entity.id,
        name: entity.attributes?.name,
        kind: entity.attributes?.kind,
        namespace: entity.attributes?.namespace,
        owner: entity.attributes?.owner,
        description: entity.attributes?.description,
        displayName: entity.attributes?.displayName,
        tags: entity.attributes?.tags,
        apiVersion: entity.attributes?.apiVersion,
        additionalProperties: entity.attributes?.additionalProperties,
      });
    },
  );

  // Team with members: dd://team/{teamId}
  server.registerResource(
    "team",
    new ResourceTemplate("dd://team/{teamId}", { list: undefined }),
    {
      title: "Datadog Team",
      description: "Team metadata and members by team ID",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const teamId = decodeURIComponent(String(vars.teamId));
      const [teamResponse, membersResponse] = await Promise.all([
        teamsApi.getTeam({ teamId }),
        teamsApi.getTeamMemberships({ teamId, pageSize: 50, pageNumber: 0 }),
      ]);
      const team = teamResponse.data;
      const members = membersResponse.data ?? [];
      return asJson(uri.toString(), {
        team: team
          ? {
              id: team.id,
              name: team.attributes?.name,
              handle: team.attributes?.handle,
              description: team.attributes?.description,
              summary: team.attributes?.summary,
              userCount: team.attributes?.userCount,
              linkCount: team.attributes?.linkCount,
              avatar: team.attributes?.avatar,
              createdAt: team.attributes?.createdAt?.toISOString(),
              modifiedAt: team.attributes?.modifiedAt?.toISOString(),
            }
          : null,
        members: {
          count: members.length,
          items: members.map((m) => ({
            id: m.id,
            role: m.attributes?.role,
            provisionedBy: m.attributes?.provisionedBy,
            relationships: m.relationships,
          })),
        },
      });
    },
  );

  // Synthetics test definition: dd://synthetics/{testId}
  server.registerResource(
    "synthetics",
    new ResourceTemplate("dd://synthetics/{testId}", { list: undefined }),
    {
      title: "Datadog Synthetics Test",
      description: "Synthetics test definition by public ID",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const testId = decodeURIComponent(String(vars.testId));
      const data = await syntheticsApi.getAPITest({ publicId: testId });
      return asJson(uri.toString(), data);
    },
  );

  // --- Apps SDK UI templates (ui:// scheme) ---
  // Rendered by ChatGPT / Apps SDK clients via _meta["openai/outputTemplate"].
  // Claude clients ignore this resource (only fetched when explicitly addressed).
  server.registerResource(
    "slo-compliance-snapshot-card",
    "ui://widget/slo-compliance-snapshot.html",
    {
      title: "SLO Compliance Snapshot card",
      description: "Apps SDK UI template rendered with slo-compliance-snapshot tool output",
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/outputTemplate": "ui://widget/slo-compliance-snapshot.html",
        "ui.resourceUri": "ui://widget/slo-compliance-snapshot.html",
      },
    },
    async (uri) => ({
      contents: [{
        uri: uri.toString(),
        mimeType: "text/html+skybridge",
        text: SLO_SNAPSHOT_HTML,
      }],
    }),
  );
}
