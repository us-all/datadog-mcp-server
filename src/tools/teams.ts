import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { teamsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

// --- List Teams ---

export const listTeamsSchema = z.object({
  filterKeyword: z.string().optional().describe("Search keyword to filter teams by name or handle"),
  pageSize: z.coerce.number().optional().default(25).describe("Number of results per page (default 25, max 100)"),
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
  sort: z.enum(["name", "-name", "user_count", "-user_count"]).optional().default("name").describe("Sort order"),
});

export async function listTeams(params: z.infer<typeof listTeamsSchema>) {
  const response = await teamsApi.listTeams({
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
    sort: params.sort as v2.ListTeamsSort,
    ...(params.filterKeyword ? { filterKeyword: params.filterKeyword } : {}),
  });

  const teams = response.data ?? [];
  return {
    count: teams.length,
    teams: teams.map(formatTeam),
  };
}

// --- Get Team ---

export const getTeamSchema = z.object({
  teamId: z.string().describe("The team ID to retrieve"),
});

export async function getTeam(params: z.infer<typeof getTeamSchema>) {
  const response = await teamsApi.getTeam({
    teamId: params.teamId,
  });

  return formatTeam(response.data!);
}

// --- Create Team ---

export const createTeamSchema = z.object({
  name: z.string().describe("The name of the team"),
  handle: z.string().describe("The team's unique identifier/handle (lowercase, hyphens allowed)"),
  description: z.string().optional().describe("Free-form markdown description for the team's homepage"),
});

export async function createTeam(params: z.infer<typeof createTeamSchema>) {
  assertWriteAllowed();

  const attributes = new v2.TeamCreateAttributes();
  attributes.name = params.name;
  attributes.handle = params.handle;
  if (params.description) attributes.description = params.description;

  const data = new v2.TeamCreate();
  data.type = "team" as v2.TeamType;
  data.attributes = attributes;

  const body = new v2.TeamCreateRequest();
  body.data = data;

  const response = await teamsApi.createTeam({ body });

  return formatTeam(response.data!);
}

// --- Update Team ---

export const updateTeamSchema = z.object({
  teamId: z.string().describe("The team ID to update"),
  name: z.string().optional().describe("Updated name of the team"),
  handle: z.string().optional().describe("Updated handle of the team"),
  description: z.string().optional().describe("Updated description"),
});

export async function updateTeam(params: z.infer<typeof updateTeamSchema>) {
  assertWriteAllowed();

  const attributes = new v2.TeamUpdateAttributes();
  if (params.name !== undefined) attributes.name = params.name;
  if (params.handle !== undefined) attributes.handle = params.handle;
  if (params.description !== undefined) attributes.description = params.description;

  const data = new v2.TeamUpdate();
  data.type = "team" as v2.TeamType;
  data.attributes = attributes;

  const body = new v2.TeamUpdateRequest();
  body.data = data;

  const response = await teamsApi.updateTeam({
    teamId: params.teamId,
    body,
  });

  return formatTeam(response.data!);
}

// --- Delete Team ---

export const deleteTeamSchema = z.object({
  teamId: z.string().describe("The team ID to delete"),
});

export async function deleteTeam(params: z.infer<typeof deleteTeamSchema>) {
  assertWriteAllowed();

  await teamsApi.deleteTeam({
    teamId: params.teamId,
  });

  return { deleted: true, teamId: params.teamId };
}

// --- Get Team Members ---

export const getTeamMembersSchema = z.object({
  teamId: z.string().describe("The team ID to get members for"),
  pageSize: z.coerce.number().optional().default(50).describe("Number of results per page (default 50)"),
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
});

export async function getTeamMembers(params: z.infer<typeof getTeamMembersSchema>) {
  const response = await teamsApi.getTeamMemberships({
    teamId: params.teamId,
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
  });

  const members = response.data ?? [];
  return {
    count: members.length,
    members: members.map((m) => ({
      id: m.id,
      role: m.attributes?.role,
      provisionedBy: m.attributes?.provisionedBy,
      relationships: m.relationships,
    })),
  };
}

// --- Helper ---

function formatTeam(team: v2.Team) {
  return {
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
  };
}
